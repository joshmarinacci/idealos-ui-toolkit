import {CEvent, GElement, GRenderNode, MKeyboardEvent, MMouseEvent, MouseButton, MWheelEvent, ZERO_POINT,} from "./base.js";
import {doDraw, drawDebug, RenderContext} from "./gfx.js";
import {Bounds, Point, Size, make_logger, Logger} from "josh_js_util";
import {KEY_VENDOR} from "./keys.js";
import {drawDebugCompInfo} from "./debug.js";

export type SceneOpts = {
    size: Size;
    debug_enabled?:boolean
}
export abstract class Scene {
    private elementRoot!: GElement;
    renderRoot!: GRenderNode;
    private makeTree: () => GElement;
    private current_hover: string | undefined;
    private keyboard_target: string | undefined
    private keyboard_path: string[];
    private current_mouse_target: string | undefined;
    private debug_target: string | undefined
    private debug_path: GRenderNode[];
    private renderMap: Map<string, GRenderNode>;
    private should_redraw_callback?: () => void;
    private should_just_redraw_callback?: () => void;
    protected opts: Required<SceneOpts>;
    private log: Logger;

    constructor(opts:SceneOpts) {
        this.log = make_logger("SCENE")
        this.log.setEnabled(true)
        this.opts = {
            debug_enabled: opts.debug_enabled || false,
            size:opts.size
        }
        this.makeTree = () => {
            throw new Error("component building function not set in Scene")
        }
        this.renderMap = new Map<string, GRenderNode>();
        this.keyboard_path = []
        this.debug_path = []
    }

    getSize() {
        return this.opts.size
    }
    setSize(size: Size) {
        this.opts.size = size
    }

    async init() {
    }

    protected abstract makeRc():RenderContext

    layout() {
        this.log.info("layout")
        if(!this.renderMap) this.renderMap = new Map()
        KEY_VENDOR.reset()
        // this.log("layout phase")
        // MGlobals.get(STATE_CACHE).dump()
        let rc = this.makeRc()
        KEY_VENDOR.start()
        this.elementRoot = this.makeTree()
        this.log.info("constraints space",rc.size,)
        this.renderRoot = this.elementRoot.layout(rc, {space: rc.size, layout: 'grow'})
        // console.log(`final render root ${this.renderRoot.settings.pos} `)
        // console.log(`final zero point ${ZERO_POINT}`)
        KEY_VENDOR.end()
        // KEY_VENDOR.dump(this.renderRoot)
        this.syncRenderMap(this.renderRoot)
    }

    redraw() {
        this.log.info("redraw")
        let rc = this.makeRc()
        rc.surface.save()
        rc.surface.scale(rc.scale, rc.scale)
        // rc.ctx.translate(10,10)
        rc.surface.fillRect(Bounds.fromPointSize(ZERO_POINT,rc.size),'#f0f0f0')
        doDraw(this.renderRoot, rc,false)
        if(this.opts.debug_enabled) {
            drawDebug(this.renderRoot, rc, this.debug_target, false)
            // doDraw(this.renderRoot,rc,true)
            this.drawDebugOverlay(rc)
        }
        rc.surface.restore()
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

    public handleMouseMove(pos: Point, button:MouseButton, shift:boolean) {
        let evt:MMouseEvent = {
            type:'mouse-move',
            redraw: () => this.request_layout_and_redraw(),
            position:pos,
            shift:shift,
            button:button,
            use: () => {}
        }
        this.ifTarget(this.current_mouse_target, (comp:GRenderNode) => {
            if(comp.settings.handleEvent) comp.settings.handleEvent(evt)
        })
        let found = this.findTarget(pos, this.renderRoot)
        if (found) {
            // debug overlay
            // if(found.settings.key !== this.debug_target) {
                // console.log("swap",found.settings.key, this.debug_target)
                // this.ifTarget(this.debug_target,(comp) => comp.debug = false)
                // found.debug = true
                // this.debug_target = found.settings.key
                // this.request_just_redraw()
            // }

            // hover effect
            if(found.settings.key !== this.current_hover) {
                this.ifTarget(this.current_hover, (comp) => comp.hover = false)
                found.hover = true
                this.current_hover = found.settings.key
                this.request_just_redraw()
            }
        }
    }
    handleMouseDown(pos: Point,button:MouseButton,shift:boolean) {
        let evt:MMouseEvent = {
            type:'mouse-down',
            redraw: () => this.request_layout_and_redraw(),
            use: () => {},
            position:pos,
            shift:shift,
            button:button
        }
        let found = this.findTargetStack(pos, this.renderRoot)
        if(found) {
            let last = found[found.length - 1]
            this.current_mouse_target = last.settings.key
            // if (last.settings.handleEvent) last.settings.handleEvent(evt)
            if(last.settings.key !== this.debug_target && shift) {
                this.ifTarget(this.debug_target,(comp) => comp.debug = false)
                this.debug_target = last.settings.key
                this.request_just_redraw()
            }
            //swap focus
            this.ifTarget(this.keyboard_target,(comp) => comp.focused = false)
            last.focused = true
            this.keyboard_target = last.settings.key
            this.keyboard_path = found.map(n => n.settings.key)
            this.debug_path = found
            // dispatch event
            this.dispatchEvent(evt,this.keyboard_path)
            this.request_just_redraw()
        }
    }
    handleMouseUp(pos:Point, button:MouseButton, shift:boolean) {
        let evt:MMouseEvent = {
            type:'mouse-up',
            redraw: () => this.request_layout_and_redraw(),
            use: () => {},
            position:pos,
            button: button,
            shift:shift,
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
        rc.surface.save()
        const bounds = new Bounds(this.opts.size.w-300,0,300,this.opts.size.h)
        drawDebugCompInfo(rc,this.debug_path,bounds)
        rc.surface.restore()
    }

    onShouldRedraw(cb: () => void) {
        this.should_redraw_callback = cb
    }
    onShouldJustRedraw(cb: () => void) {
        this.should_just_redraw_callback = cb
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

    private dispatchEvent(evt: CEvent, keys: string[]) {
        keys = keys.slice()
        let used = false
        evt.use = () => {
            // console.log("using it")
            used = true
        }
        while(true) {
            if(keys.length < 1) break
            let key = keys.pop() as string
            let node = this.renderMap.get(key)
            if(node) {
                // console.log("sending to ", node.settings.key, node.settings.kind)
                if (node.settings.handleEvent) {
                    node.settings.handleEvent(evt)
                    if (used) {
                        // console.log("it was used. done");
                        break
                    } else {
                        // console.log("was not used. going up")
                    }
                } else {
                    // console.warn("didn't handle event")
                }
            } else {
                // console.warn("no comp")
                break;
            }
        }
    }

    setComponentFunction(compFunc: () => GElement) {
        this.makeTree = compFunc
    }
}
