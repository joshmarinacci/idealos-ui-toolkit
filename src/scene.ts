import {
    GElement,
    GRenderNode,
    MKeyboardEvent,
    MMouseEvent,
    MWheelEvent, ZERO_INSETS,
} from "./base.js";
import {doDraw, drawDebug, fillRect, RenderContext, strokeBounds} from "./gfx.js";
import {Bounds, Insets, Point, Size} from "josh_js_util";
import {KEY_VENDOR} from "./keys.js";

function text(ctx: CanvasRenderingContext2D, text: string, point: Point, valign, halign) {
    ctx.textBaseline = valign
    ctx.textAlign = halign
    ctx.fillText(text,point.x,point.y)
}

function drawInsets(ctx: CanvasRenderingContext2D, b: Bounds, ins: Insets, color: string) {
        fillRect(ctx, b, color)
        ctx.fillStyle = 'black'
        ctx.font = '11px sans-serif'
        text(ctx, '' + ins.top, b.top_midpoint(), 'top', 'center')
        text(ctx, '' + ins.bottom, b.bottom_midpoint(), 'bottom', 'center')
        text(ctx, '' + ins.left, b.left_midpoint(), 'middle', 'left')
        text(ctx, '' + ins.right, b.right_midpoint(), 'middle', 'right')
}

function isInvalid(size: Size) {
    if(!size) return true
    if(isNaN(size.w)) return true
    if(isNaN(size.h)) return true
    if(!(size instanceof Size)) return true
    return false
}

export class Scene {
    private elementRoot!: GElement;
    renderRoot!: GRenderNode;
    canvas!: HTMLCanvasElement;
    private makeTree: () => GElement;
    private current_hover: string | undefined;
    private keyboard_target: string | undefined
    private current_mouse_target: string | undefined;
    private debug_target: string | undefined
    private renderMap: Map<string, GRenderNode>;
    private size: Size;
    private should_redraw_callback?: () => void;
    private devicePixelRatio: number;
    private should_just_redraw_callback?: () => void;

    constructor(makeTree: () => GElement) {
        this.makeTree = makeTree
        this.devicePixelRatio = 1
    }

    private log(...text: any[]) {
        console.log("SCENE: ",...text)
    }
    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas
    }
    getCanvas() {
        return this.canvas
    }
    setSize(size: Size) {
        this.size = size
    }

    async init() {
    }

    private makeRc() {
        const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D

        let sc = 1* this.devicePixelRatio
        const rc: RenderContext = {
            canvas: this.canvas,
            ctx: ctx,
            scale: sc,
            debug: {
                metrics: false
            },
            size: new Size(this.canvas.width / sc, this.canvas.height / sc)
        }
        return rc
    }

    layout() {
        if(!this.renderMap) this.renderMap = new Map()
        KEY_VENDOR.reset()
        // this.log("layout phase")
        // MGlobals.get(STATE_CACHE).dump()
        let rc = this.makeRc()
        KEY_VENDOR.start()
        this.elementRoot = this.makeTree()
        this.renderRoot = this.elementRoot.layout(rc, {space: rc.size, layout: 'grow'})
        KEY_VENDOR.end()
        // KEY_VENDOR.dump(this.renderRoot)
        this.syncRenderMap(this.renderRoot)
    }

    redraw() {
        let rc = this.makeRc()
        rc.ctx.save()
        rc.ctx.scale(rc.scale, rc.scale)
        // rc.ctx.translate(10,10)
        rc.ctx.fillStyle = '#f0f0f0'
        rc.ctx.fillRect(0, 0, rc.size.w, rc.size.h);
        doDraw(this.renderRoot, rc,false)
        drawDebug(this.renderRoot, rc, this.debug_target,false)
        // doDraw(this.renderRoot,rc,true)
        this.drawDebugOverlay(rc)
        rc.ctx.restore()
    }

    private findTarget(pos: Point, node: GRenderNode): GRenderNode | undefined {
        const bounds = Bounds.fromPointSize(node.settings.pos, node.settings.size)
        if (bounds.contains(pos)) {
            if (node.settings.children) {
                // go backwards
                for(let i=node.settings.children.length-1; i>=0; i--) {
                    let ch = node.settings.children[i]
                    // console.log("ch under mouse is",ch)
                    if (ch.settings.shadow) continue
                    let p2 = pos.subtract(bounds.top_left())
                    let found = this.findTarget(p2, ch)
                    if (found) return found
                }
            }
            return node
        }
    }
    private findTargetStack(pos: Point, node: GRenderNode): GRenderNode[]|undefined {
        const bounds = Bounds.fromPointSize(node.settings.pos, node.settings.size)
        if (bounds.contains(pos)) {
            if (node.settings.children) {
                // go backwards
                for(let i=node.settings.children.length-1; i>=0; i--) {
                    let ch = node.settings.children[i]
                    // console.log("ch under mouse is",ch)
                    if (ch.settings.shadow) continue
                    let p2 = pos.subtract(bounds.top_left())
                    let found = this.findTargetStack(p2, ch)
                    if (found) {
                        return [node].concat(found)
                    }
                }
            }
            return [node]
        }
        return undefined
    }
    private findScrollTarget(pos: Point, node: GRenderNode):GRenderNode | undefined {
        const bounds = Bounds.fromPointSize(node.settings.pos, node.settings.size)
        if (bounds.contains(pos)) {
            if (node.settings.children) {
                // go backwards
                for(let i=node.settings.children.length-1; i>=0; i--) {
                    let ch = node.settings.children[i]
                    // console.log("ch under mouse is",ch)
                    if (ch.settings.shadow) continue
                    let p2 = pos.subtract(bounds.top_left())
                    let found = this.findScrollTarget(p2, ch)
                    if (found) return found
                }
            }
            if(node.settings.canScroll === true) {
                return node
            }
        }
    }
    private syncRenderMap(renderRoot: GRenderNode) {
        if(renderRoot.settings.key) this.renderMap.set(renderRoot.settings.key, renderRoot)
        renderRoot.settings.children.forEach(child => {
            this.syncRenderMap(child)
        })
    }
    private ifTarget(target: string | undefined, param2: (comp: GRenderNode) => void) {
        if(!target) return
        if(this.renderMap.has(target)) {
            let comp = this.renderMap.get(target) as GRenderNode
            param2(comp)
        }
    }

    public handleMouseMove(pos: Point) {
        // dispatch old mouse move
        let evt:MMouseEvent = {
            type:'mouse-move',
            redraw: () => this.request_layout_and_redraw(),
            position:pos
        }
        this.ifTarget(this.current_mouse_target, (comp:GRenderNode) => {
            if(comp.settings.handleEvent) comp.settings.handleEvent(evt)
        })
        let found = this.findTarget(pos, this.renderRoot)
        if (found) {
            // debug overlay
            if(found.settings.key !== this.debug_target) {
                // console.log("swap",found.settings.key, this.debug_target)
                // this.ifTarget(this.debug_target,(comp) => comp.debug = false)
                // found.debug = true
                // this.debug_target = found.settings.key
                // this.request_just_redraw()
            }

            // hover effect
            if(found.settings.key !== this.current_hover) {
                this.ifTarget(this.current_hover, (comp) => comp.hover = false)
                found.hover = true
                this.current_hover = found.settings.key
                this.request_just_redraw()
            }
        }
    }
    handleMouseDown(pos: Point,shift:boolean) {
        let evt:MMouseEvent = {
            type:'mouse-down',
            redraw: () => this.request_layout_and_redraw(),
            position:pos
        }
        let found = this.findTargetStack(pos, this.renderRoot)
        if(found) {
            let last = found[found.length - 1]
            this.current_mouse_target = last.settings.key
            // if(shift) {
            //     this.debugPrintTarget(found)
            // }
            if (last.settings.handleEvent) last.settings.handleEvent(evt)
            if(last.settings.key !== this.keyboard_target) {
                // this.ifTarget(this.keyboard_target,(comp)=>{
                    // comp.settings.currentStyle = comp.settings.visualStyle
                // })
            }
            if(last.settings.key !== this.debug_target) {
                // console.log("swap",last.settings.key, this.debug_target)
                this.ifTarget(this.debug_target,(comp) => comp.debug = false)
                // found.debug = true
                this.debug_target = last.settings.key
                this.request_just_redraw()
            }
            // if(last.settings.focusedStyle) {
            //     // last.settings.currentStyle = last.settings.focusedStyle
            // }
            this.ifTarget(this.keyboard_target,(comp) => comp.focused = false)
            last.focused = true
            this.keyboard_target = last.settings.key
            // console.log("set focused",last)
            this.request_just_redraw()
        }
    }
    handleMouseUp(pos:Point) {
        let evt:MMouseEvent = {
            type:'mouse-up',
            redraw: () => this.request_layout_and_redraw(),
            position:pos
        }
        this.ifTarget(this.current_mouse_target, (comp:GRenderNode) => {
            if(comp.settings.handleEvent)  comp.settings.handleEvent(evt)
        })
    }
    handleKeydownEvent(key:string, control:boolean, shift:boolean) {
        // this.log("kbd ",key,'to',this.keyboard_target)
        this.ifTarget(this.keyboard_target,(comp)=>{
            let evt: MKeyboardEvent = {
                type: 'keyboard-typed',
                redraw: () => this.request_layout_and_redraw(),
                key: key,
                control: control,
                shift:shift,
            }
            if(comp.settings.handleEvent) comp.settings.handleEvent(evt)
        })
    }
    public handleWheelEvent(pos: Point, delta:Point) {
        let found = this.findScrollTarget(pos, this.renderRoot)
        if(found) {
            // console.log("scroll target",found)
            const evt:MWheelEvent = {
                type: 'wheel',
                deltaX:delta.x,
                deltaY:delta.y,
                redraw: () => {
                    if(this.should_redraw_callback) {
                        this.should_redraw_callback()
                    } else {
                        this.layout()
                        this.redraw()
                    }
                },
            }
            if(found.settings.handleEvent) found.settings.handleEvent(evt)
        }
    }

    private debugPrintTarget(found: GRenderNode[]) {
        console.log("CORE SAMPLE")
        found.forEach(n => {
            console.log(n.settings.key, n.settings.kind)
            if(n.userdata.constraints) {
                console.table(n.userdata['constraints'])
            }
            // console.log(`size ${n.settings.size}`)
            // console.log('border', n.settings.borderWidth)
        })
    }
    private drawDebugOverlay(rc: RenderContext) {
        rc.ctx.save()
        // rc.ctx.translate(0, rc.size.h-100)
        rc.ctx.strokeStyle = 'red'
        const bounds = new Bounds(rc.canvas.width/2-400,0,400,rc.canvas.height/2)
        this.debugStrokeBounds(rc,bounds,'red',1)
        this.debugFillBounds(rc,bounds,'rgba(255,255,255,0.5)')
        this.ifTarget(this.debug_target,(comp)=>{
            rc.ctx.save()
            rc.ctx.translate(bounds.x,bounds.y)
            this.drawDebugCompInfo(rc,comp, bounds.w)
            rc.ctx.restore()
        })
        rc.ctx.restore()
    }
    private debugStrokeBounds(rc: RenderContext, bounds: Bounds, fill: string, thickness: number) {
        rc.ctx.strokeStyle = fill
        rc.ctx.lineWidth = thickness
        rc.ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h)
    }
    private debugFillBounds(rc: RenderContext, bounds: Bounds, fill: string) {
        rc.ctx.fillStyle = fill
        rc.ctx.fillRect(bounds.x,bounds.y,bounds.w,bounds.h)
    }
    private debugText(rc: RenderContext, bounds: Bounds, text: string, color:string) {
        rc.ctx.fillStyle = color || 'black'
        rc.ctx.fillText(text,bounds.x,bounds.y+20)
    }


    onShouldRedraw(cb: () => void) {
        this.should_redraw_callback = cb
    }
    onShouldJustRedraw(cb: () => void) {
        this.should_just_redraw_callback = cb
    }

    setDPI(devicePixelRatio: number) {
        this.devicePixelRatio = devicePixelRatio
    }

    private request_just_redraw() {
        if(this.should_just_redraw_callback) this.should_just_redraw_callback()
    }

    private request_layout_and_redraw() {
        if(this.should_redraw_callback) {
            this.should_redraw_callback()
        } else {
            this.layout()
            this.redraw()
        }
    }

    private drawDebugCompInfo(rc: RenderContext, comp: GRenderNode, w: number) {
        const lh = 16
        let bounds = new Bounds(0,0,w,100)
        fillRect(rc.ctx,bounds,'white')
        strokeBounds(rc,bounds,'black')
        let t = comp.settings

        rc.ctx.fillStyle = 'black'
        rc.ctx.font = '11px sans-serif'
        rc.ctx.textAlign = 'start'
        rc.ctx.textBaseline = 'middle'

        rc.ctx.save()
        let b = new Bounds( w-100,0,100,100)
        //fill rect around size
        drawInsets(rc.ctx,b,comp.settings.borderWidth || ZERO_INSETS,'#aaaaaa')
        b =b.grow(-15)
        drawInsets(rc.ctx,b,comp.settings.padding || ZERO_INSETS,'#f0f0f0')
        b =b.grow(-15)
        fillRect(rc.ctx,b,'#f0d000')
        //fill rect around inner content
        rc.ctx.restore()

        this.debugText(rc,bounds,` kind = ${t.kind}  key=${t.key}`,'black')
        rc.ctx.translate(0,lh)
        if(isInvalid(t.size)) {
            this.debugText(rc,bounds,` pos = ${t.pos} size = ${t.size}`,'red')
        } else {
            this.debugText(rc,bounds,` pos = ${t.pos} size = ${t.size}`,'black')
        }
        rc.ctx.translate(0,lh)
        this.debugText(rc,bounds,` text = ${t.text}`)
        // rc.ctx.translate(0,lh)
        // this.debugText(rc,bounds,` padding = ${t.padding}`)


        comp.settings.children.forEach((ch,i) => {
            rc.ctx.save()
            rc.ctx.translate(0,105*i+100)
            this.drawDebugCompInfo(rc,ch,w)
            rc.ctx.restore()
        })
    }
}
