import {Bounds, Insets, Point, Size} from "josh_js_util";
import {GRenderNode, TRANSPARENT} from "./base.js";
import {bdsSubInsets} from "./layout.js";

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

function drawBorder(ctx: CanvasRenderingContext2D, b: Bounds, color: string, w: Insets) {
    // console.log("DRAW BORDER", b,color,w)
    ctx.fillStyle = color
    ctx.fillRect(b.x, b.y, b.w, w.top);
    ctx.fillRect(b.x, b.y, w.left, b.h);
    ctx.fillRect(b.x2-w.right,b.y,w.right,b.h)
    ctx.fillRect(b.x,b.y2-w.bottom,b.w,w.bottom)
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

function fillRoundRect(ctx: CanvasRenderingContext2D, bounds: Bounds, radius: Insets, fill: string) {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.roundRect(bounds.x,bounds.y,bounds.w, bounds.h, [radius.top, radius.right, radius.bottom, radius.left])
    ctx.fill()
}

function strokeRoundRect(ctx: CanvasRenderingContext2D, bounds: Bounds, radius: Insets, color: string, borderWidth: Insets) {
    ctx.strokeStyle = color
    ctx.lineWidth = borderWidth.left
    ctx.beginPath()
    ctx.roundRect(bounds.x,bounds.y,bounds.w, bounds.h, [radius.top, radius.right, radius.bottom, radius.left])
    ctx.stroke()
}

export function doDraw(n: GRenderNode, rc: RenderContext, popups:boolean): void {
    // console.log("drawing", n.settings.kind, n.settings.key)
    if(!n.settings.visualStyle) throw new Error("no visual style found")
    // if(!n.settings.currentStyle) n.settings.currentStyle = n.settings.visualStyle
    // if(!n.settings.currentStyle.background) n.settings.currentStyle.background = n.settings.currentStyle.background = n.settings.visualStyle.background
    // if(!n.settings.currentStyle.borderColor) n.settings.currentStyle.borderColor = n.settings.currentStyle.borderColor = n.settings.visualStyle.borderColor
    // console.log("border is",n.settings.borderWidth,"border color is", n.settings.currentStyle.borderColor)
    let draw_node = true
    if(popups && !n.settings.popup) {
        draw_node = false
    }
    if(!popups && n.settings.popup) {
        draw_node = false
    }
    // console.log('drawing',n.settings.pos)
    rc.ctx.save()
    rc.ctx.translate(n.settings.pos.x, n.settings.pos.y)

    let bounds = Bounds.fromPointSize(new Point(0,0,),n.settings.size)

    if(!n.settings.margin) {
        console.log(n.settings)
        throw new Error(`missing margin on ${n.settings.kind}`)
    }
    // account for margin
    bounds = bdsSubInsets(bounds,n.settings.margin)

    // fill background inside padding  + border area
    if (draw_node && n.settings.visualStyle.background) {
        if(n.settings.borderRadius) {
            fillRoundRect(rc.ctx,bounds, n.settings.borderRadius, n.settings.visualStyle.background)
        } else {
            fillRect(rc.ctx, bounds, n.settings.visualStyle.background)
        }
    }

    // draw / fill border
    if (draw_node && n.settings.visualStyle.borderColor && n.settings.visualStyle.borderColor !== TRANSPARENT) {
        if(n.settings.borderRadius) {
            strokeRoundRect(rc.ctx, bounds, n.settings.borderRadius,n.settings.visualStyle.borderColor, n.settings.borderWidth)
            // rc.ctx.clip()
        } else {
            drawBorder(rc.ctx, bounds, n.settings.visualStyle.borderColor, n.settings.borderWidth)
        }
    }
    // account for the border
    bounds = bdsSubInsets(bounds, n.settings.borderWidth)

    // account for the padding
    bounds = bdsSubInsets(bounds,n.settings.padding)

    // draw text
    if (draw_node && n.settings.text && n.settings.text.trim().length > 0) {
        // console.log("drawing text",n.settings.text)
        rc.ctx.fillStyle = n.settings.visualStyle.textColor || "black"
        rc.ctx.font = n.settings.font
        // rc.ctx.textRendering = 'optimizeLegibility'
        // rc.ctx.textAlign = 'start'
        // rc.ctx.textBaseline = 'alphabetic'
        // console.log("font",rc.ctx.font)
        // console.log(`drawing metrics "${n.settings.text}" => ${rc.ctx.measureText(n.settings.text).width}`)
        let x = n.settings.contentOffset.x
        let y = n.settings.contentOffset.y + n.settings.baseline
        // console.log("text",n.settings.text, n.settings.font, "baseline",y)
        rc.ctx.fillText(n.settings.text,x,y)
    }

    if(n.settings.clip) {
        rc.ctx.beginPath()
        rc.ctx.rect(bounds.x,bounds.y,bounds.w,bounds.h)
        rc.ctx.clip()
    }
    n.settings.children.forEach(ch => {
        if(n.settings.popup) {
            if(popups) {
                doDraw(ch, rc, false)
            } else {

            }
        } else {
            doDraw(ch, rc, popups)
        }
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
        debugText(rc, n.settings.kind, new Point(5, 10))
    }
    rc.ctx.restore()
}

export function withInsets(number: number) {
    return new Insets(number, number, number, number)
}
