import {makeCanvas} from "./util.ts";
import { Size} from "josh_js_util";
import {doDraw, RenderContext, withInsets} from "./gfx.ts";
import {GElement} from "./base.ts";
import {MHBoxElement, Square, Style, TextElement, ZERO_INSETS} from "./comps2.ts";

const canvas = makeCanvas(new Size(600,300))
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D


/*

    // make hbox layout account for width of the text child
    // don't double scale
    implement stretching for child by wrapping in Expander()
    // make hbox fill space or not
    debug render margin box
    // debug render padding box
    render border box
    make background only be inside of the border box

 */
let sc = 2 * window.devicePixelRatio
const rc:RenderContext = {
    canvas:canvas,
    ctx: ctx,
    scale:sc,
    debug:{
        metrics: false
    },
    size: new Size(canvas.width/sc, canvas.height/sc)
}


function makeTree():GElement {
    return new MHBoxElement({
        mainAxisSelfLayout:'grow',
        crossAxisSelfLayout:'grow',
        mainAxisLayout:'center',
        background:Style.panelBackgroundColor,
        padding: Style.panelPadding,
        margin: Style.panelMargin,
        borderWidth: Style.panelBorderWidth,
        borderColor:Style.panelBorderColor,
        children:[
            Square(50,"red"),
            new TextElement({
                text:"Every text",
                padding: withInsets(5),
                font: Style.font,
                margin: withInsets(5),
                borderColor: 'transparent',
                borderWidth: ZERO_INSETS,
                backgroundColor:'transparent',
            }),
            Square(50,"green"),
        ],
    })
}


const elementRoot = makeTree()
const renderRoot = elementRoot.layout(rc, rc.size)
rc.ctx.save()
rc.ctx.scale(rc.scale, rc.scale)
// rc.ctx.translate(10,10)
rc.ctx.fillStyle = '#f0f0f0'
rc.ctx.fillRect(0,0,rc.size.w,rc.size.h);
doDraw(renderRoot,rc)
rc.ctx.restore()
