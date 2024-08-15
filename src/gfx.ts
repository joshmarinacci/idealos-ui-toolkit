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

export function fillRect(ctx: CanvasRenderingContext2D, bounds: Bounds, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
}

function strokeRect(ctx: CanvasRenderingContext2D, bounds: Bounds, color: string) {
    ctx.fillStyle = color
    ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
}

export function withPadding(ss: Bounds, padding: Insets) {
    return new Bounds(ss.x, ss.y,
        ss.w + padding.left + padding.right,
        ss.h + padding.top + padding.bottom,
    )
}
export function sizeWithPadding(ss: Size, padding: Insets) {
    return new Size(    ss.w + padding.left + padding.right,
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

function fillRoundRect(ctx: CanvasRenderingContext2D, bounds: Bounds, radius: number, fill: string) {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.roundRect(bounds.x,bounds.y,bounds.w, bounds.h, radius)
    ctx.fill()
}

function strokeRoundRect(ctx: CanvasRenderingContext2D, bounds: Bounds, radius: number, color: string) {
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.roundRect(bounds.x,bounds.y,bounds.w, bounds.h, radius)
    ctx.stroke()
}

export function doDraw(n: GRenderNode, rc: RenderContext): void {
    // console.log("drawing", n.settings.id, n.settings.borderRadius)
    rc.ctx.save()
    rc.ctx.translate(n.settings.pos.x, n.settings.pos.y)

    let bounds = Bounds.fromPointSize(new Point(0,0,),n.settings.size)

    // account for margin
    bounds = bounds.grow(-n.settings.margin.left)

    // fill background inside padding  + border area
    if (n.settings.background) {
        fillRect(rc.ctx,bounds, n.settings.background)
    }

    // draw / fill border
    if (n.settings.borderColor && n.settings.borderWidth.left > 0) {
        if(n.settings.borderRadius && n.settings.borderRadius > 0) {
            strokeRoundRect(rc.ctx, bounds, n.settings.borderRadius,n.settings.borderColor)
            // rc.ctx.clip()
        } else {
            strokeRect(rc.ctx, bounds, n.settings.borderColor)
        }
    }
    // account for the border
    bounds = bounds.grow(-n.settings.borderWidth.left)

    // account for the padding
    bounds = bounds.grow(-n.settings.padding.left)

    // draw text
    if (n.settings.text && n.settings.text.trim().length > 0) {
        rc.ctx.fillStyle = n.settings.textColor
        rc.ctx.font = n.settings.font
        rc.ctx.textRendering = 'optimizeLegibility'
        rc.ctx.textAlign = 'start'
        rc.ctx.textBaseline = 'alphabetic'
        // console.log("font",rc.ctx.font)
        // console.log(`drawing metrics "${n.settings.text}" => ${rc.ctx.measureText(n.settings.text).width}`)
        let x = n.settings.contentOffset.x
        let y = n.settings.contentOffset.y + n.settings.baseline
        rc.ctx.fillText(n.settings.text, x,y)
    }

    n.settings.children.forEach(ch => {
        doDraw(ch, rc)
    })

    if (rc.debug.metrics) {
        // draw the padding
        let ss: Bounds = Bounds.fromPointSize(new Point(0, 0,), n.settings.size)
        ss = ss.grow(-n.settings.margin.left)
        strokeBounds(rc, ss, 'yellow')
        ss = ss.grow(-n.settings.borderWidth.left)
        strokeBounds(rc, ss, 'yellow')
        ss = ss.grow(-n.settings.padding.left)
        strokeBounds(rc, ss, 'cyan')
        // ss = withPadding(ss, n.settings.padding)

        // draw the baseline
        rc.ctx.fillStyle = 'cyan'
        rc.ctx.fillRect(n.settings.contentOffset.x, n.settings.contentOffset.y + n.settings.baseline, n.settings.size.w, 1)
        debugText(rc, n.settings.id, new Point(5, 10))
    }
    rc.ctx.restore()
}

export function withInsets(number: number) {
    return new Insets(number, number, number, number)
}
