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
} from "./base.ts";
import {doDraw, RenderContext} from "./gfx.ts";
import {makeCanvas} from "./util.ts";
import {Bounds, Point, Size} from "josh_js_util";
import {STATE_CACHE} from "./state.ts";

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

    constructor(makeTree: () => GElement) {
        this.borderDebugEnabled = false
        this.makeTree = makeTree
        this.lastStyle = NULL_VISUAL_STYLE
        this.debugStyle = {
            borderColor: "red",
            textColor: 'black',
            background:'white',
        }
    }

    async init(size:Size) {
        if(MGlobals.get(SYMBOL_FONT_ENABLED) === true) {
            // const font = new FontFace('material-icons',
            //     'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)')
            const font = new FontFace('material-icons',
                'url(material-symbols/material-symbols-outlined.woff2)')
            document.fonts.add(font)
            await font.load()
        }
        this.canvas = makeCanvas(size)
        this.last = undefined
        this.canvas.addEventListener('mousemove', (e) => {
            // @ts-ignore
            let rect = e.target.getBoundingClientRect()
            let pos = new Point(e.clientX, e.clientY);
            pos = pos.subtract(new Point(rect.x, rect.y))
            this.handleMouseMove(pos)
        })

        this.canvas.addEventListener('mousedown', (e) => {
            // @ts-ignore
            let rect = e.target.getBoundingClientRect()
            let pos = new Point(e.clientX, e.clientY);
            pos = pos.subtract(new Point(rect.x, rect.y))
            this.handleMouseDown(pos)
        })
        this.canvas.addEventListener('mouseup', (e) => {
            // @ts-ignore
            let rect = e.target.getBoundingClientRect()
            let pos = new Point(e.clientX, e.clientY);
            pos = pos.subtract(new Point(rect.x, rect.y))
            this.handleMouseUp(pos)
        })
        window.addEventListener('keydown', (e) => {
            this.handleKeydownEvent(e)
        })
        window.addEventListener('wheel', (e) => {
            // @ts-ignore
            let rect = e.target.getBoundingClientRect()
            let pos = new Point(e.clientX, e.clientY);
            pos = pos.subtract(new Point(rect.x, rect.y))
            this.handleWheelEvent(pos,e)
        })
    }

    makeRc() {
        const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D

        let sc = 1 * window.devicePixelRatio
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
        this.log("layout phase")
        // MGlobals.get(STATE_CACHE).dump()
        let rc = this.makeRc()
        this.elementRoot = this.makeTree()
        this.renderRoot = this.elementRoot.layout(rc, {space: rc.size, layout: 'grow'})
        this.syncRenderMap(this.renderRoot)
    }

    redraw() {
        let rc = this.makeRc()
        rc.ctx.save()
        rc.ctx.scale(rc.scale, rc.scale)
        // rc.ctx.translate(10,10)
        rc.ctx.fillStyle = '#f0f0f0'
        rc.ctx.fillRect(0, 0, rc.size.w, rc.size.h);
        doDraw(this.renderRoot, rc)
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

    handleMouseMove(pos: Point) {
        // console.log("mouse at",pos,found?found.settings.id:"nothing")
        this.ifTarget(this.current_target, (comp:GRenderNode) => {
            let evt:MMouseEvent = {
                type:'mouse-move',
                redraw: () => {
                    this.layout()
                    this.redraw()
                },
                position:pos
            }
            if(comp.settings.handleEvent)  comp.settings.handleEvent(evt)
        })
        let found = this.findTarget(pos, this.renderRoot)
        if (found) {
            if(found.settings.hoverStyle && found.settings.key !== this.current_hover) {
                this.ifTarget(this.current_hover, (comp) => {
                    comp.settings.currentStyle = comp.settings.visualStyle
                })
                found.settings.currentStyle = found.settings.hoverStyle
                this.current_hover = found.settings.key
                this.redraw()
            }
        }
    }

    handleMouseDown(pos: Point) {
        let found = this.findTarget(pos, this.renderRoot)
        if(found) {
            this.current_target = found.settings.key
            this.debugPrintTarget()
            let evt:MMouseEvent = {
                type:'mouse-down',
                redraw: () => {
                    this.layout()
                    this.redraw()
                },
                position:pos
            }
            if (found.settings.handleEvent) found.settings.handleEvent(evt)
            if(found.settings.inputid) {
                this.keyboard_target = found.settings.inputid
                if(found.settings.focusedStyle) {
                    found.settings.currentStyle = found.settings.focusedStyle
                    this.redraw()
                }
            }
            this.redraw()
        }
    }
    handleMouseUp(pos:Point) {
        this.ifTarget(this.current_target, (comp:GRenderNode) => {
            let evt:MMouseEvent = {
                type:'mouse-up',
                redraw: () => {
                    this.layout()
                    this.redraw()
                },
                position:pos
            }
            if(comp.settings.handleEvent)  comp.settings.handleEvent(evt)
        })

    }

    handleKeydownEvent(e: KeyboardEvent) {
        if(this.keyboard_target) {
            // console.log("native event",e)
            let target = this.findByInputId(this.keyboard_target, this.renderRoot)
            if(target && target.settings.handleEvent) {
                let evt: MKeyboardEvent = {
                    type: 'keyboard-typed',
                    redraw: () => {
                        this.layout()
                        this.redraw()
                    },
                    key: e.key,
                    control: e.ctrlKey
                }
                target.settings.handleEvent(evt)
            }
        }
    }

    private findByInputId(keyboard_target: string, renderRoot: GRenderNode):GRenderNode|undefined {
        if(renderRoot.settings.inputid === keyboard_target) return renderRoot
        for(let ch of renderRoot.settings.children) {
            let found = this.findByInputId(keyboard_target,ch)
            if(found) return found
        }
    }

    private handleWheelEvent(pos: Point, e: WheelEvent) {
        let found = this.findScrollTarget(pos, this.renderRoot)
        if(found) {
            // console.log("scroll target",found)
            const evt:MWheelEvent = {
                type: 'wheel',
                deltaX:e.deltaX,
                deltaY:e.deltaY,
                redraw: () => {
                    this.layout()
                    this.redraw()
                },
            }
            // console.log(evt.type,evt.deltaX,evt.deltaY)
            if(found.settings.handleEvent) found.settings.handleEvent(evt)
        }
    }

    private debugPrintTarget() {
        this.ifTarget(this.current_target, (comp)=>{
            console.log("target on",
                comp.settings.id,
                comp.settings.key,
                comp.settings.pos.toString(),
                comp.settings.size.toString())
            console.log("  insets")
            console.log('  margin', comp.settings.margin)
            console.log('  border',comp.settings.borderWidth)
            console.log('  padding',comp.settings.padding)
        })
        if(this.current_target) {
            if(this.renderMap.has(this.current_target)) {
                console.log("have target")
            }
        }
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
            this.debugText(rc,bounds,` id=${t.id} ${t.pos} ${t.size}`)
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

    private log(...layoutPhase: string[]) {
        console.log("SCENE: ",...layoutPhase)
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
}
