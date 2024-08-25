import {
    GElement,
    GRenderNode,
    MGlobals,
    MKeyboardEvent,
    MMouseEvent,
    MWheelEvent,
    SYMBOL_FONT_ENABLED,
    TRANSPARENT,
    VisualStyle
} from "./base.js";
import {doDraw, RenderContext} from "./gfx.js";
import {Bounds, Point, Size} from "josh_js_util";
import {KEY_VENDOR} from "./keys.js";

let NULL_VISUAL_STYLE:VisualStyle = {
    borderColor:TRANSPARENT,
    background:TRANSPARENT,
    textColor:TRANSPARENT,
};

export class Scene {
    private elementRoot!: GElement;
    renderRoot!: GRenderNode;
    canvas!: HTMLCanvasElement;
    private last: GRenderNode | undefined
    private lastStyle: VisualStyle
    private debugStyle: VisualStyle
    private makeTree: () => GElement;
    private borderDebugEnabled: boolean;
    private current_hover: string | undefined;
    private keyboard_target: string | undefined
    private current_target: string | undefined;
    private renderMap: Map<string, GRenderNode>;
    private size: Size;
    private should_redraw_callback?: () => void;
    private devicePixelRatio: number;

    constructor(makeTree: () => GElement) {
        this.borderDebugEnabled = false
        this.makeTree = makeTree
        this.lastStyle = NULL_VISUAL_STYLE
        this.last = undefined
        this.debugStyle = {
            borderColor: "red",
            textColor: 'black',
            background:'white',
        }
        this.devicePixelRatio = 1
    }

    private log(...layoutPhase: string[]) {
        console.log("SCENE: ",...layoutPhase)
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
        if(MGlobals.get(SYMBOL_FONT_ENABLED) === true) {
            // const font = new FontFace('material-icons',
            //     'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)')
            // const font = new FontFace('material-icons',
            //     'url(material-symbols/material-symbols-outlined.woff2)')
            // document.fonts.add(font)
            // await font.load()
        }
        // this.canvas = makeCanvas(size)
        // this.last = undefined
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
        this.log("layout phase")
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
        this.ifTarget(this.current_target, (comp:GRenderNode) => {
            let evt:MMouseEvent = {
                type:'mouse-move',
                redraw: () => {
                    if(this.should_redraw_callback) {
                        this.should_redraw_callback()
                    } else {
                        this.layout()
                        this.redraw()
                    }
                },
                position:pos
            }
            if(comp.settings.handleEvent)  {
                comp.settings.handleEvent(evt)
            }
        })
        let found = this.findTarget(pos, this.renderRoot)
        if (found) {
            if(found.settings.key !== this.current_hover) {
                this.ifTarget(this.current_hover, (comp) => {
                    comp.settings.currentStyle = comp.settings.visualStyle
                })
                if(found.settings.hoverStyle)  {
                    found.settings.currentStyle = found.settings.hoverStyle
                }
                this.current_hover = found.settings.key
                    if(this.should_redraw_callback) {
                        this.should_redraw_callback()
                    } else {
                        this.layout()
                        this.redraw()
                    }
            }
        }
    }
    handleMouseDown(pos: Point,shift:boolean) {
        let found = this.findTargetStack(pos, this.renderRoot)
        if(found) {
            let last = found[found.length - 1]
            this.current_target = last.settings.key
            if(shift) {
                this.debugPrintTarget(found)
            }
            let evt:MMouseEvent = {
                type:'mouse-down',
                redraw: () => {
                    if(this.should_redraw_callback) {
                        this.should_redraw_callback()
                    } else {
                        this.layout()
                        this.redraw()
                    }
                },
                position:pos
            }
            if (last.settings.handleEvent) last.settings.handleEvent(evt)
            if(last.settings.key !== this.keyboard_target) {
                this.ifTarget(this.keyboard_target,(comp)=>{
                    comp.settings.currentStyle = comp.settings.visualStyle
                })
            }
            if(last.settings.focusedStyle) {
                last.settings.currentStyle = last.settings.focusedStyle
            }
            this.keyboard_target = last.settings.key
            if(this.should_redraw_callback) {
                this.should_redraw_callback()
            } else {
                this.layout()
                this.redraw()
            }
        }
    }
    handleMouseUp(pos:Point) {
        this.ifTarget(this.current_target, (comp:GRenderNode) => {
            let evt:MMouseEvent = {
                type:'mouse-up',
                redraw: () => {
                    if(this.should_redraw_callback) {
                        this.should_redraw_callback()
                    } else {
                        this.layout()
                        this.redraw()
                    }
                },
                position:pos
            }
            if(comp.settings.handleEvent)  comp.settings.handleEvent(evt)
        })

    }
    handleKeydownEvent(e: KeyboardEvent) {
        this.ifTarget(this.keyboard_target,(comp)=>{
            let evt: MKeyboardEvent = {
                type: 'keyboard-typed',
                redraw: () => {
                    if(this.should_redraw_callback) {
                        this.should_redraw_callback()
                    } else {
                        this.layout()
                        this.redraw()
                    }
                },
                key: e.key,
                control: e.ctrlKey
            }
            if(comp.settings.handleEvent) comp.settings.handleEvent(evt)
        })
    }
    handleWheelEvent(pos: Point, e: WheelEvent) {
        let found = this.findScrollTarget(pos, this.renderRoot)
        if(found) {
            // console.log("scroll target",found)
            const evt:MWheelEvent = {
                type: 'wheel',
                deltaX:e.deltaX,
                deltaY:e.deltaY,
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
        rc.ctx.translate(0, rc.size.h-100)
        rc.ctx.strokeStyle = 'red'
        const bounds = new Bounds(0,0,rc.canvas.width,rc.size.h-100)
        this.debugStrokeBounds(rc,bounds,'red',1)
        this.debugFillBounds(rc,bounds,'rgba(255,255,255,0.5)')
        this.ifTarget(this.current_target,(comp)=>{
            let t = comp.settings
            this.debugText(rc,bounds,` id=${t.kind} ${t.pos} ${t.size}`)
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
    private debugText(rc: RenderContext, bounds: Bounds, s: string) {
        rc.ctx.fillStyle = 'black'
        rc.ctx.fillText(s,bounds.x,bounds.y+20)
    }


    onShouldRedraw(cb: () => void) {
        this.should_redraw_callback = cb
    }

    setDPI(devicePixelRatio: number) {
        this.devicePixelRatio = devicePixelRatio
    }
}
