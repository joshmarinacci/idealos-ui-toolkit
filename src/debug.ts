import {Bounds, Insets, Point, Size} from "josh_js_util";
import {RenderContext} from "./gfx.js";
import {GRenderNode, ZERO_INSETS} from "./base.js";
import {BoxConstraints} from "./layout.js";

export type TextValign = "top" | "middle" | "bottom"
export type TextHalign = "left" | 'center' | "right"

export function drawInsets(rc:RenderContext, b: Bounds, ins: Insets, color: string) {
    rc.surface.fillRect(b, color)
    const s = {
        color:'black',
        fontSize:11,
        fontFamily:'sans-serif'
    }
    rc.surface.fillText(''+ins.top, b.top_midpoint(),{...s, valign:'top', halign:'center' })
    rc.surface.fillText(''+ins.bottom, b.bottom_midpoint(),{...s, valign:'bottom', halign:'center' })
    rc.surface.fillText(''+ins.left, b.left_midpoint(), {...s, valign:'middle', halign:'left' })
    rc.surface.fillText(''+ins.right, b.right_midpoint(),{...s, valign:'middle', halign:'right' })
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
    rc.surface.fillText(text,pos, {
        fontSize:12,
        fontFamily: 'sans-serif',
        color:color,
        valign:'middle',
        halign:'left'
    })
}

export function drawDebugCompInfo (rc: RenderContext, path: GRenderNode[], debugBounds:Bounds) {
    const lh = 16
    path.forEach((node, i)=>{
        try {
            let t = node.settings
            let bounds = Bounds.fromPointSize(debugBounds.position(), new Size(debugBounds.w, 100))
                .add(new Point(0, i * 100))
            rc.surface.fillRect(bounds, 'rgba(255,255,255,0.6)')
            rc.surface.strokeBounds(bounds, 'black',1)
            let pos = bounds.position().copy()
            pos.y += lh

            debugText(rc, pos, ` kind: ${t.kind}  key=${t.key}`, 'black')
            pos.y += lh
            debugText(rc, pos, ` pos: ${t.pos}`, isInvalidPoint(t.pos) ? 'red' : 'black')
            pos.y += lh
            debugText(rc, pos, ` size: ${t.size}`, isInvalidSize(t.size) ? 'red' : 'black')

            // draw spacing diagram
            let b = new Bounds(debugBounds.right() - 100, bounds.y, 100, 100)
            //fill rect around size
            drawInsets(rc, b, node.settings.borderWidth || ZERO_INSETS, '#aaaaaa')
            b = b.grow(-15)
            drawInsets(rc, b, node.settings.padding || ZERO_INSETS, '#f0f0f0')
            b = b.grow(-15)
            rc.surface.fillRect(b,'#f0d000')

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
