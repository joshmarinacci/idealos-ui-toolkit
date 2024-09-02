import {Bounds, Insets, Point, Size} from "josh_js_util";
import {GRenderNode, RenderNodeSettings, TRANSPARENT} from "./base.js";

import {bdsSubInsets} from "./util.js";

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

function isInsetsEmpty(insets: Insets | undefined) {
    if(!insets) return true
    return insets.left <= 0 && insets.right <= 0 && insets.top <= 0 && insets.bottom <= 0
}

function calculateBorderRadius(settings: RenderNodeSettings) {
    if(!settings.borderRadius) return undefined
    if(typeof settings.borderRadius === 'number') {
        let num = settings.borderRadius as number
        if(num === 0) return undefined
        return withInsets(num)
    }
    let insets = settings.borderRadius as Insets
    if(isInsetsEmpty(insets)) {
        return undefined
    }
    return insets
}

function doDrawBackground(rc: RenderContext, n: GRenderNode, bounds: Bounds) {
    let bg = n.settings.visualStyle.background || "magenta"
    if(n.hover && n.settings.hoverStyle && n.settings.hoverStyle.background) {
        bg = n.settings.hoverStyle.background
    }
    if(n.focused && n.settings.focusedStyle && n.settings.focusedStyle.background) {
        bg = n.settings.focusedStyle.background
    }
    let rad = calculateBorderRadius(n.settings)
    if(rad) {
        fillRoundRect(rc.ctx,bounds, rad, bg)
    } else {
        fillRect(rc.ctx, bounds, bg)
    }
}

function doDrawBorder(rc: RenderContext, n: GRenderNode, bounds: Bounds) {
    if(!n.settings.visualStyle.borderColor) return
    if(n.settings.visualStyle.borderColor === TRANSPARENT) return
    let color = n.settings.visualStyle.borderColor || "magenta"
    if(isInsetsEmpty(n.settings.borderWidth)) return
    if(n.focused && n.settings.focusedStyle?.borderColor) {
        color = n.settings.focusedStyle.borderColor
    }
    let rad = calculateBorderRadius(n.settings)
    if(rad) {
        strokeRoundRect(rc.ctx, bounds, rad,color, n.settings.borderWidth as Insets)
        // rc.ctx.clip()
    } else {
        drawBorder(rc.ctx, bounds, color, n.settings.borderWidth as Insets)
    }
}

function doDrawText(rc: RenderContext, n: GRenderNode) {
    if(!n.settings.text) return
    // console.log("drawing text",n.settings.text)
    rc.ctx.fillStyle = n.settings.visualStyle.textColor || "magenta"
    let fontStr = `${n.settings.fontWeight} ${n.settings.fontSize}px ${n.settings.font}`
    // console.log("text",n.settings.text, fontStr)//, "baseline",y)
    rc.ctx.font = fontStr
    // rc.ctx.textRendering = 'optimizeLegibility'
    // rc.ctx.textAlign = 'start'
    // rc.ctx.textBaseline = 'alphabetic'
    // console.log("font",rc.ctx.font)
    // console.log(`drawing metrics "${n.settings.text}" => ${rc.ctx.measureText(n.settings.text).width}`)
    let x = n.settings.contentOffset.x
    let y = n.settings.contentOffset.y + n.settings.baseline
    rc.ctx.fillText(n.settings.text,x,y)

}

function validateNode(n: GRenderNode) {
    if(!n.settings.padding) {
        console.log(n.settings)
        throw new Error(`missing padding on ${n.settings.kind}`)
    }
}

export function withInsets(number: number) {
    return new Insets(number, number, number, number)
}

export function doDraw(n: GRenderNode, rc: RenderContext, popups:boolean): void {
    if(!n.settings.visualStyle) throw new Error("no visual style found")
    validateNode(n)
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


    // fill background inside padding  + border area
    if (draw_node && n.settings.visualStyle.background) {
        doDrawBackground(rc,n,bounds)
    }

    // draw / fill border
    if (draw_node) {
        doDrawBorder(rc,n,bounds)
    }

    // account for the border
    bounds = bdsSubInsets(bounds, n.settings.borderWidth)
    // account for the padding
    bounds = bdsSubInsets(bounds,n.settings.padding)

    // draw text
    if (draw_node && n.settings.text && n.settings.text.trim().length > 0) {
        doDrawText(rc,n)
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
        // let ss: Bounds = Bounds.fromPointSize(new Point(0, 0,), n.settings.size)
        // ss = ss.grow(-n.settings.borderWidth.left)
        // strokeBounds(rc, ss, 'yellow')
        // ss = ss.grow(-n.settings.padding.left)
        // strokeBounds(rc, ss, 'cyan')
        // ss = withPadding(ss, n.settings.padding)

        // draw the baseline
        rc.ctx.fillStyle = 'cyan'
        rc.ctx.fillRect(n.settings.contentOffset.x, n.settings.contentOffset.y + n.settings.baseline, n.settings.size.w, 1)
        debugText(rc, n.settings.kind, new Point(5, 10))
    }
    rc.ctx.restore()
}

export function drawDebug(n: GRenderNode, rc: RenderContext, force:boolean, tab?:string) {
    rc.ctx.save()
    let bds2;
    if (n.debug || force) {
        tab = tab?tab:""
        console.log(tab,n.settings.kind, n.settings.children.length)
        console.log(tab,'-','size',n.settings.size)
        console.log(tab,'-','bdrw',n.settings.borderWidth)
        console.log(tab,'-','padd',n.settings.padding)
        rc.ctx.strokeStyle = 'red'
        rc.ctx.lineWidth = 1
        let bds = Bounds.fromPointSize(n.settings.pos.floor(), n.settings.size)
        strokeBounds(rc, bds, 'red')
        bds2 = bdsSubInsets(bds, n.settings.borderWidth as Insets)
        bds2 = bdsSubInsets(bds, n.settings.padding)
        strokeBounds(rc, bds2, 'green')
        rc.ctx.translate(n.settings.pos.x, n.settings.pos.y)
        n.settings.children.forEach((ch, i)=> drawDebug(ch, rc, true, tab + "  "))
        rc.ctx.translate(-n.settings.pos.x, -n.settings.pos.y)
        // rc.ctx.restore()
    }
    rc.ctx.translate(n.settings.pos.x, n.settings.pos.y)
    n.settings.children.forEach(ch => drawDebug(ch, rc,false))
    rc.ctx.restore()
}
