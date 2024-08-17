import {GElement, GRenderNode} from "./base.ts";
import {BorderStyle, NULL_BORDER_STYLE} from "./style.ts";
import {doDraw, RenderContext, withInsets} from "./gfx.ts";
import {makeCanvas} from "./util.ts";
import {Bounds, Point, Size} from "josh_js_util";

export class Scene {
    private elementRoot!: GElement;
    renderRoot!: GRenderNode;
    canvas!: HTMLCanvasElement;
    private last: GRenderNode | undefined
    private lastBorderStyle: BorderStyle
    private debugBorder: BorderStyle
    private makeTree: () => GElement;

    constructor(makeTree: () => GElement) {
        this.makeTree = makeTree
        this.lastBorderStyle = NULL_BORDER_STYLE
        this.debugBorder = {
            borderColor: "red",
            borderWidth: withInsets(1),
            borderRadius: 0,
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
                for (let ch of node.settings.children) {
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
            if (found !== this.last) {
                if (this.last) {
                    this.last.settings.borderWidth = this.lastBorderStyle.borderWidth
                    this.last.settings.borderColor = this.lastBorderStyle.borderColor
                }
                this.lastBorderStyle = {
                    borderColor: found.settings.borderColor,
                    borderWidth: found.settings.borderWidth,
                    borderRadius: found.settings.borderRadius,
                }
                found.settings.borderWidth = this.debugBorder.borderWidth
                found.settings.borderColor = this.debugBorder.borderColor
                // found.settings.background = 'blue'
                this.redraw()
                this.last = found
            }
        }
    }

    handleMouseDown(pos: Point) {
        let found = this.findTarget(pos, this.renderRoot)
        if(found) {
            console.log("clicked on", found.settings.id, found.settings)
            if (found.settings.handleEvent) found.settings.handleEvent({
                type: "mouse-down",
                redraw: () => {
                    this.layout()
                    this.redraw()
                },
            })
        }
    }
}
