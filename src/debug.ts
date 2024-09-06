import {Bounds, Insets, Point, Size} from "josh_js_util";
import {RenderContext, strokeBounds} from "./gfx.js";
import {GRenderNode, ZERO_INSETS} from "./base.js";
import {BoxConstraints} from "./layout.js";

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
export function isInvalidSize(size: Size) {
    if (!size) return true
    if (isNaN(size.w)) return true
    if (isNaN(size.h)) return true
    if (!(size instanceof Size)) return true
    return false
}
export function isInvalidPoint(point: Point) {
    if (!point) return true
    if (isNaN(point.x)) return true
    if (isNaN(point.y)) return true
    if (!(point instanceof Point)) return true
    return false
}
export function debugText(rc: RenderContext, pos:Point, text: string, color:string) {
    rc.ctx.fillStyle = 'black'
    rc.ctx.font = '12px sans-serif'
    rc.ctx.textAlign = 'start'
    rc.ctx.textBaseline = 'middle'
    rc.ctx.fillStyle = color || 'black'
    rc.ctx.fillText(text,pos.x,pos.y+20)
}

export function drawDebugCompInfo (rc: RenderContext, path: GRenderNode[], debugBounds:Bounds) {
    const lh = 16
    path.forEach((node, i)=>{
        try {
            let t = node.settings
            let bounds = Bounds.fromPointSize(debugBounds.position(), new Size(debugBounds.w, 100))
                .add(new Point(0, i * 100))
            rc.surface.fillRect(bounds, 'rgba(255,255,255,0.6)')
            strokeBounds(rc, bounds, 'black')
            let pos = bounds.position().copy()

            debugText(rc, pos, ` kind: ${t.kind}  key=${t.key}`, 'black')
            pos.y += lh
            debugText(rc, pos, ` pos: ${t.pos}`, isInvalidPoint(t.pos) ? 'red' : 'black')
            pos.y += lh
            debugText(rc, pos, ` size: ${t.size}`, isInvalidSize(t.size) ? 'red' : 'black')

            // draw spacing diagram
            let b = new Bounds(debugBounds.right() - 100, bounds.y, 100, 100)
            //fill rect around size
            drawInsets(rc.ctx, b, node.settings.borderWidth || ZERO_INSETS, '#aaaaaa')
            b = b.grow(-15)
            drawInsets(rc.ctx, b, node.settings.padding || ZERO_INSETS, '#f0f0f0')
            b = b.grow(-15)
            fillRect(rc.ctx, b, '#f0d000')

            if(node.userdata) {
                if(node.userdata['constraints']) {
                    const cons:BoxConstraints = node.userdata.constraints
                    pos.y += lh
                    debugText(rc,pos, ` self: ${cons.mainAxisSelfLayout} ${cons.crossAxisSelfLayout}`,'black')
                    pos.y += lh
                    debugText(rc,pos, ` kids: ${cons.mainAxisLayout} ${cons.crossAxisLayout}`,'black')
                }
            }
        } catch (e) {
            console.error(e)
        }
    })
}
