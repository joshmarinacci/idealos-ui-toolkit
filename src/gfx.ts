import {Bounds, Insets, Point, Size} from "josh_js_util";
import {FontSettings, GRenderNode, RenderNodeSettings, TRANSPARENT} from "./base.js";

import {bdsSubInsets} from "./util.js";

export type RenderingSurface = {
    save():void
    scale(s1:number,s2:number):void
    translate(off:Point):void
    restore():void
    fillRect(bounds: Bounds, color: string): void;
    measureText(fontSettings: FontSettings, text: string): [Size, number];
    fillText(settings: RenderNodeSettings, text: string, color: string): void;
    clipRect(bounds: Bounds): void;
    strokeBounds(bounds: Bounds, color: string, thickness: number): void;
}
export type RenderContext = {
    size: Size
    scale: number
    surface: RenderingSurface
}


function drawBorder(rc: RenderContext, b: Bounds, color: string, w: Insets) {
    // console.log("DRAW BORDER", b,color,w)
    rc.surface.fillRect(new Bounds(b.x, b.y, b.w, w.top),color);
    rc.surface.fillRect(new Bounds(b.x, b.y, w.left, b.h),color);
    rc.surface.fillRect(new Bounds(b.x2-w.right, b.y, w.right, b.h),color);
    rc.surface.fillRect(new Bounds(b.x, b.y2-w.bottom, b.w, w.bottom),color);
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

// export function strokeBounds(rc: RenderContext, size: Bounds, color: string) {
//     rc.ctx.strokeStyle = color
//     rc.ctx.strokeRect(size.x, size.y, size.w, size.h)
// }

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
        // fillRoundRect(rc.ctx,bounds, rad, bg)
        rc.surface.fillRect(bounds, bg)
    } else {
        rc.surface.fillRect(bounds, bg)
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
        // strokeRoundRect(rc.ctx, bounds, rad,color, n.settings.borderWidth as Insets)
        drawBorder(rc, bounds, color, n.settings.borderWidth as Insets)
        // rc.ctx.clip()
    } else {
        drawBorder(rc, bounds, color, n.settings.borderWidth as Insets)
    }
}

function doDrawText(rc: RenderContext, n: GRenderNode) {
    if(!n.settings.text) return
    // console.log("drawing text",n.settings.text)
    rc.surface.fillText(n.settings,n.settings.text,n.settings.visualStyle.textColor || 'magenta')
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
    rc.surface.save()
    rc.surface.translate(n.settings.pos.floor())

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
        rc.surface.clipRect(bounds)
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

    // if (rc.debug.metrics) {
    //     rc.ctx.fillStyle = 'cyan'
    //     rc.ctx.fillRect(n.settings.contentOffset.x, n.settings.contentOffset.y + n.settings.baseline, n.settings.size.w, 1)
    //     debugText(rc, n.settings.kind, new Point(5, 10))
    // }
    rc.surface.restore()
}

export function drawDebug(n: GRenderNode, rc: RenderContext, debug:string|undefined, force:boolean, tab?:string) {
    rc.surface.save()
    let bds2;
    if (n.settings.key === debug || force) {
        tab = tab?tab:""
        // console.log(tab,n.settings.kind, n.settings.children.length)
        // console.log(tab,'-','size',n.settings.size)
        // console.log(tab,'-','bdrw',n.settings.borderWidth)
        // console.log(tab,'-','padd',n.settings.padding)
        let bds = Bounds.fromPointSize(n.settings.pos.floor(), n.settings.size)
        rc.surface.strokeBounds(bds, 'red',1)
        bds2 = bdsSubInsets(bds, n.settings.borderWidth as Insets)
        bds2 = bdsSubInsets(bds, n.settings.padding)
        rc.surface.strokeBounds(bds2, 'green',1)
        rc.surface.translate(n.settings.pos)
        n.settings.children.forEach((ch, _i)=> drawDebug(ch, rc, debug, true, tab + "  "))
        rc.surface.translate(n.settings.pos.scale(-1))//-n.settings.pos.x, -n.settings.pos.y)
    }
    rc.surface.translate(n.settings.pos)
    n.settings.children.forEach(ch => drawDebug(ch, rc,debug,false))
    rc.surface.restore()
}
