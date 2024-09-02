import {Bounds, Insets, Point, Size} from "josh_js_util";
import {fillRect, RenderContext, strokeBounds} from "./gfx.js";
import {GRenderNode, ZERO_INSETS} from "./base.js";

export type TextValign = "top" | "middle" | "bottom"
export type TextHalign = "left" | 'center' | "right"
function text(ctx: CanvasRenderingContext2D, text: string, point: Point, valign:TextValign, halign:TextHalign) {
    ctx.textBaseline = valign
    ctx.textAlign = halign
    ctx.fillText(text, point.x, point.y)
}

export function drawInsets(ctx: CanvasRenderingContext2D, b: Bounds, ins: Insets, color: string) {
    fillRect(ctx, b, color)
    ctx.fillStyle = 'black'
    ctx.font = '11px sans-serif'
    text(ctx, '' + ins.top, b.top_midpoint(), 'top', 'center')
    text(ctx, '' + ins.bottom, b.bottom_midpoint(), 'bottom', 'center')
    text(ctx, '' + ins.left, b.left_midpoint(), 'middle', 'left')
    text(ctx, '' + ins.right, b.right_midpoint(), 'middle', 'right')
}

export function isInvalid(size: Size) {
    if (!size) return true
    if (isNaN(size.w)) return true
    if (isNaN(size.h)) return true
    if (!(size instanceof Size)) return true
    return false
}


export function debugText(rc: RenderContext, bounds: Bounds, text: string, color:string) {
    rc.ctx.fillStyle = color || 'black'
    rc.ctx.fillText(text,bounds.x,bounds.y+20)
}

export function drawDebugCompInfo (rc: RenderContext, comp: GRenderNode, w: number) {
    const lh = 16
    let bounds = new Bounds(0,0,w,100)
    fillRect(rc.ctx,bounds,'white')
    strokeBounds(rc,bounds,'black')
    let t = comp.settings

    rc.ctx.fillStyle = 'black'
    rc.ctx.font = '11px sans-serif'
    rc.ctx.textAlign = 'start'
    rc.ctx.textBaseline = 'middle'

    rc.ctx.save()
    let b = new Bounds( w-100,0,100,100)
    //fill rect around size
    drawInsets(rc.ctx,b,comp.settings.borderWidth || ZERO_INSETS,'#aaaaaa')
    b =b.grow(-15)
    drawInsets(rc.ctx,b,comp.settings.padding || ZERO_INSETS,'#f0f0f0')
    b =b.grow(-15)
    fillRect(rc.ctx,b,'#f0d000')
    //fill rect around inner content
    rc.ctx.restore()

    debugText(rc,bounds,` kind = ${t.kind}  key=${t.key}`,'black')
    rc.ctx.translate(0,lh)
    if(isInvalid(t.size)) {
        debugText(rc,bounds,` pos = ${t.pos} size = ${t.size}`,'red')
    } else {
        debugText(rc,bounds,` pos = ${t.pos} size = ${t.size}`,'black')
    }
    rc.ctx.translate(0,lh)
    debugText(rc,bounds,` text = ${t.text}`,'black')
    // rc.ctx.translate(0,lh)
    // this.debugText(rc,bounds,` padding = ${t.padding}`)


    comp.settings.children.forEach((ch,i) => {
        rc.ctx.save()
        rc.ctx.translate(0,105*i+100)
        drawDebugCompInfo(rc,ch,w)
        rc.ctx.restore()
    })
}
