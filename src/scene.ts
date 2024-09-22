import {CEvent, GElement, GRenderNode, MKeyboardEvent, MMouseEvent, MouseButton, MWheelEvent, ZERO_POINT,} from "./base.js";
import {doDraw, drawDebug, RenderContext} from "./gfx.js";
import {Bounds, Logger, make_logger, Point, Size} from "josh_js_util";
import {KEY_VENDOR} from "./keys.js";
import {drawDebugCompInfo} from "./debug.js";

import {findPathToNodeAtPoint, findPathToNodeByKey, findPathToScrollTargetAtPoint} from "./nodepath.js";
import {LogicalKeyboardCode} from "./keyboard.js";

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
    private prev_point: Point;

    constructor(opts:SceneOpts) {
        this.log = make_logger("SCENE")
        this.log.setEnabled(false)
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
        this.prev_point = new Point(0,0)
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

    public handleMouseMove(pointer: Point, button:MouseButton, shift:boolean) {
        let path = findPathToNodeAtPoint(pointer,this.renderRoot)
        if(path) {
            let target = path.target()
            // console.log("target",target.settings.kind, target.settings.key)
            // hover code
            if(target.settings.key !== this.current_hover) {
                this.ifTarget(this.current_hover, (comp) => comp.hover = false)
                target.hover = true
                this.current_hover = target.settings.key
                this.request_just_redraw()
            }

            // dispatch mouse move
            let evt:MMouseEvent = {
                type:'mouse-move',
                redraw: () => this.request_layout_and_redraw(),
                position:pointer,
                delta: pointer.subtract(this.prev_point),
                shift:shift,
                button:button,
                use: () => {}
            }

            if(this.current_mouse_target) {
                let path = findPathToNodeByKey(this.current_mouse_target,this.renderRoot)
                if(path) {
                    path.dispatch(evt)
                }
            } else {
                path.dispatch(evt)
            }
        }
        this.prev_point = pointer
    }
    handleMouseDown(pointer: Point,button:MouseButton,shift:boolean) {
        let path = findPathToNodeAtPoint(pointer,this.renderRoot)
        if(path) {
            // swap keyboard focus
            if(path.target().settings.key !== this.keyboard_target) {
                this.ifTarget(this.keyboard_target,(comp) => comp.focused = false)
                path.target().focused = true
                this.keyboard_target = path.target().settings.kind
                console.log("swapping keyboard target to ", this.keyboard_target)
                this.request_just_redraw()
                this.keyboard_path = path.nodes.map(n => n.settings.key)
            }

            // set the current mouse target
            this.current_mouse_target = path.target().settings.key
            console.log("current mouse target set to",this.current_mouse_target)

            // swap the debug target
            if(path.target().settings.key !== this.debug_target && shift) {
                this.ifTarget(this.debug_target,(comp) => comp.debug = false)
                this.debug_target = path.target().settings.key
                this.debug_path = path.nodes
                this.request_just_redraw()
            }

            // send mouse event
            let evt:MMouseEvent = {
                type:'mouse-down',
                redraw: () => this.request_layout_and_redraw(),
                use: () => {},
                position:pointer,
                delta: pointer.subtract(this.prev_point),
                shift:shift,
                button:button
            }
            path.dispatch(evt)
        }
        this.prev_point = pointer
    }
    handleMouseUp(pointer:Point, button:MouseButton, shift:boolean) {
        let evt:MMouseEvent = {
            type:'mouse-up',
            redraw: () => this.request_layout_and_redraw(),
            use: () => {},
            position:pointer,
            delta: pointer.subtract(this.prev_point),
            button: button,
            shift:shift,
        }
        let path = findPathToNodeByKey(this.current_mouse_target,this.renderRoot)
        if(path) {
            this.ifTarget(this.current_mouse_target, (comp:GRenderNode) => {
                if(comp.settings.handleEvent)  comp.settings.handleEvent(evt)
            })
            path.dispatch(evt)
        }
        this.current_mouse_target = undefined
        this.prev_point = pointer
    }
    handleKeydownEvent(key:LogicalKeyboardCode, control:boolean, shift:boolean, alt:boolean, meta:boolean) {
        let evt: MKeyboardEvent = {
            type: 'keyboard-typed',
            redraw: () => this.request_layout_and_redraw(),
            use: () => {},
            key, control, shift, alt, meta
        }
        this.dispatchEvent(evt,this.keyboard_path)
    }
    public handleWheelEvent(pos: Point, delta:Point) {
        let path = findPathToScrollTargetAtPoint(pos, this.renderRoot)
        if(path) {
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
            path.dispatch(evt)
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
            console.time("layout")
            this.layout()
            console.timeEnd("layout")
            console.time("redraw")
            this.redraw()
            console.timeEnd("redraw")
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
