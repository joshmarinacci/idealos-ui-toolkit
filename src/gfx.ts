import {Bounds, Insets, Point, Size} from "josh_js_util";
import {GRenderNode} from "./base.ts";

export type RenderContext = {
    size: Size;
    scale: number
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
    debug: {
        metrics: boolean
    },
}

export function fillRect(ctx: CanvasRenderingContext2D, bounds: Bounds, background: string) {
    ctx.fillStyle = background
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
}

export function withPadding(ss: Bounds, padding: Insets) {
    return new Bounds(ss.x, ss.y,
        ss.w + padding.left + padding.right,
        ss.h + padding.top + padding.bottom,
    )
}

export function debugText(rc: RenderContext, id: string, pos: Point) {
    rc.ctx.font = '10px sans-serif'
    rc.ctx.fillStyle = 'aqua'
    rc.ctx.fillText(id, pos.x, pos.y)
}

export function strokeBounds(rc: RenderContext, size: Bounds, color: string) {
    rc.ctx.strokeStyle = color
    rc.ctx.strokeRect(size.x, size.y, size.w, size.h)
}

export function doDraw(n: GRenderNode, rc: RenderContext): void {
    console.log("drawing", n.settings.id, n.settings.pos)
    rc.ctx.save()
    rc.ctx.translate(n.settings.pos.x, n.settings.pos.y)
    // fill bg
    if (n.settings.background) {
        let size = n.settings.size
        fillRect(rc.ctx,
            Bounds.fromPointSize(new Point(0, 0), size),
            n.settings.background)
    }

    // draw text
    if (n.settings.text && n.settings.text.trim().length > 0) {
        rc.ctx.fillStyle = 'black'
        rc.ctx.font = n.settings.font
        rc.ctx.textRendering = 'optimizeLegibility'
        rc.ctx.textAlign = 'start'
        rc.ctx.textBaseline = 'alphabetic'
        // console.log("font",rc.ctx.font)
        // console.log(`drawing metrics "${n.settings.text}" => ${rc.ctx.measureText(n.settings.text).width}`)
        rc.ctx.fillText(n.settings.text, 0, 0 + n.settings.baseline)
    }

    n.settings.children.forEach(ch => {
        doDraw(ch, rc)
    })

    if (rc.debug.metrics) {
        // draw the padding
        let ss: Bounds = Bounds.fromPointSize(new Point(0, 0,), n.settings.size)
        ss = withPadding(ss, n.settings.padding)
        strokeBounds(rc, ss, 'yellow')
        // draw the baseline
        rc.ctx.fillStyle = 'purple'
        rc.ctx.fillRect(0, 0 + n.settings.baseline, n.settings.size.w, 1)
        debugText(rc, n.settings.id, new Point(5, 10))
    }
    rc.ctx.restore()
}
