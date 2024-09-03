import {CEvent, GElement, GRenderNode, MKeyboardEvent, MMouseEvent, MWheelEvent,} from "./base.js";
import {doDraw, drawDebug, RenderContext} from "./gfx.js";
import {Bounds, Point, Size} from "josh_js_util";
import {KEY_VENDOR} from "./keys.js";
import {drawDebugCompInfo} from "./debug.js";

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
    private keyboard_path: GRenderNode[];
    private debug_enabled: boolean;

    constructor(makeTree: () => GElement) {
        this.debug_enabled = false
        this.makeTree = makeTree
        this.devicePixelRatio = 1
        this.size = new Size(100,100)
        this.renderMap = new Map<string, GRenderNode>();
        this.keyboard_path = []
    }

    // private log(...text: any[]) {
    //     console.log("SCENE: ",...text)
    // }
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
        this.log("layout")
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
        this.log("redraw")
        let rc = this.makeRc()
        rc.ctx.save()
        rc.ctx.scale(rc.scale, rc.scale)
        // rc.ctx.translate(10,10)
        rc.ctx.fillStyle = '#f0f0f0'
        rc.ctx.fillRect(0, 0, rc.size.w, rc.size.h);
        doDraw(this.renderRoot, rc,false)
        if(this.debug_enabled) {
            drawDebug(this.renderRoot, rc, this.debug_target, false)
            // doDraw(this.renderRoot,rc,true)
            this.drawDebugOverlay(rc)
        }
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
        let evt:MMouseEvent = {
            type:'mouse-move',
            redraw: () => this.request_layout_and_redraw(),
            position:pos,
            shift:false,
            use: () => {}
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
            use: () => {},
            position:pos,
            shift:shift,
        }
        let found = this.findTargetStack(pos, this.renderRoot)
        if(found) {
            let last = found[found.length - 1]
            this.current_mouse_target = last.settings.key
            // if (last.settings.handleEvent) last.settings.handleEvent(evt)
            if(last.settings.key !== this.debug_target) {
                this.ifTarget(this.debug_target,(comp) => comp.debug = false)
                this.debug_target = last.settings.key
                this.request_just_redraw()
            }
            //swap focus
            this.ifTarget(this.keyboard_target,(comp) => comp.focused = false)
            last.focused = true
            this.keyboard_target = last.settings.key
            this.keyboard_path = found
            // dispatch event
            this.dispatchEvent(evt,found.slice())
            this.request_just_redraw()
        }
    }
    handleMouseUp(pos:Point) {
        let evt:MMouseEvent = {
            type:'mouse-up',
            redraw: () => this.request_layout_and_redraw(),
            use: () => {},
            position:pos,
            shift:false,
        }
        this.ifTarget(this.current_mouse_target, (comp:GRenderNode) => {
            if(comp.settings.handleEvent)  comp.settings.handleEvent(evt)
        })
    }
    handleKeydownEvent(key:string, control:boolean, shift:boolean) {
        let evt: MKeyboardEvent = {
            type: 'keyboard-typed',
            redraw: () => this.request_layout_and_redraw(),
            use: () => {},
            key: key,
            control: control,
            shift:shift,
        }
        this.dispatchEvent(evt,this.keyboard_path)
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
                use: () => {}
            }
            if(found.settings.handleEvent) found.settings.handleEvent(evt)
        }
    }

    private drawDebugOverlay(rc: RenderContext) {
        rc.ctx.save()
        rc.ctx.strokeStyle = 'red'
        const bounds = new Bounds(this.size.w-400,0,400,this.size.h)
        this.debugStrokeBounds(rc,bounds,'red',1)
        this.debugFillBounds(rc,bounds,'rgba(255,255,255,0.5)')
        this.ifTarget(this.debug_target,(comp)=>{
            rc.ctx.save()
            rc.ctx.translate(bounds.x,bounds.y)
            drawDebugCompInfo(rc,comp, bounds.w)
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

    private dispatchEvent(evt: CEvent, nodes: GRenderNode[]) {
        nodes = nodes.slice()
        console.log("===\nevt",evt.type)
        let used = false
        evt.use = () => {
            console.log("using it")
            used = true
        }
        while(true) {
            let comp = nodes.pop()
            if (comp) {
                console.log("sending to ", comp.settings.key, comp.settings.kind)
                if (comp.settings.handleEvent) {
                    comp.settings.handleEvent(evt)
                    if (used) {
                        console.log("it was used. done");
                        break
                    } else {
                        console.log("was not used. going up")
                    }
                } else {
                    console.warn("didn't handle event")
                }
            } else {
                console.warn("no comp")
                break;
            }
        }
    }

    private log(str: string) {
        console.log("SCENE",str)
    }
}
