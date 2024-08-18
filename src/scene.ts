import {GElement, GRenderNode, MKeyboardEvent, MMouseEvent, TRANSPARENT, VisualStyle} from "./base.ts";
import {doDraw, RenderContext} from "./gfx.ts";
import {makeCanvas} from "./util.ts";
import {Bounds, Point, Size} from "josh_js_util";

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
    private current_hover: GRenderNode | undefined;
    private keyboard_target: string | undefined

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

    async init() {
        const font = new FontFace('material-icons',
            'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)')
        document.fonts.add(font)
        await font.load()

        this.canvas = makeCanvas(new Size(600, 300))
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
        window.addEventListener('keypress', (e) => {
            this.handleKeyTypeEvent(e)
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
        let rc = this.makeRc()
        this.elementRoot = this.makeTree()
        this.renderRoot = this.elementRoot.layout(rc, {space: rc.size, layout: 'grow'})
    }

    redraw() {
        let rc = this.makeRc()
        rc.ctx.save()
        rc.ctx.scale(rc.scale, rc.scale)
        // rc.ctx.translate(10,10)
        rc.ctx.fillStyle = '#f0f0f0'
        rc.ctx.fillRect(0, 0, rc.size.w, rc.size.h);
        doDraw(this.renderRoot, rc)
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

    handleMouseMove(pos: Point) {
        let found = this.findTarget(pos, this.renderRoot)
        // console.log("mouse at",pos,found?found.settings.id:"nothing")
        if (found) {
            if (found !== this.last && this.borderDebugEnabled) {
                if (this.last) {
                    this.last.settings.visualStyle = this.lastStyle
                }
                this.lastStyle = found.settings.visualStyle
                found.settings.visualStyle = this.debugStyle
                // found.settings.background = 'blue'
                this.redraw()
                this.last = found
            }
            if(found.settings.hoverStyle && found !== this.current_hover) {
                if(this.current_hover) this.current_hover.settings.currentStyle = this.current_hover.settings.visualStyle
                found.settings.currentStyle = found.settings.hoverStyle
                this.current_hover = found
                this.redraw()
            }
        }
    }

    handleMouseDown(pos: Point) {
        let found = this.findTarget(pos, this.renderRoot)
        if(found) {
            // console.log("clicked on", found.settings.id, found.settings)
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
        }
    }

    handleKeyTypeEvent(e: KeyboardEvent) {
        if(this.keyboard_target) {
            let target = this.findByInputId(this.keyboard_target, this.renderRoot)
            if(target && target.settings.handleEvent) {
                let evt: MKeyboardEvent = {
                    type: 'keyboard-typed',
                    redraw: () => {
                        this.layout()
                        this.redraw()
                    },
                    key: e.key
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
}
