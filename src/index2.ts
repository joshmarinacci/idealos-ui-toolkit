import {makeCanvas} from "./util.ts";
import {Size} from "josh_js_util";
import {doDraw, RenderContext, withInsets} from "./gfx.ts";
import {GElement, Style, ZERO_INSETS} from "./base.ts";
import {HExpander, MHBoxElement, Square, TextElement} from "./comps2.ts";

const canvas = makeCanvas(new Size(600, 300))
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

let sc = 1 * window.devicePixelRatio
const rc: RenderContext = {
    canvas: canvas,
    ctx: ctx,
    scale: sc,
    debug: {
        metrics: true
    },
    size: new Size(canvas.width / sc, canvas.height / sc)
}


function makeTree():GElement {
    return new MHBoxElement({
        mainAxisSelfLayout:'grow',
        crossAxisSelfLayout:'shrink',
        mainAxisLayout:'start',
        crossAxisLayout:'end',
        background:Style.panelBackgroundColor,
        padding: Style.panelPadding,
        margin: Style.panelMargin,
        borderWidth: Style.panelBorderWidth,
        borderColor:Style.panelBorderColor,
        children:[
            Square(50,"red"),
            // new HExpander(),
            new TextElement({
                text:"Every text",
                padding: withInsets(5),
                font: Style.font,
                margin: withInsets(5),
                borderColor: 'transparent',
                borderWidth: ZERO_INSETS,
                backgroundColor:'transparent',
            }),
            // Square(50,"green"),
        ],
    })
}


const elementRoot = makeTree()
const renderRoot = elementRoot.layout(rc, {space:rc.size})
rc.ctx.save()
rc.ctx.scale(rc.scale, rc.scale)
// rc.ctx.translate(10,10)
rc.ctx.fillStyle = '#f0f0f0'
rc.ctx.fillRect(0,0,rc.size.w,rc.size.h);
doDraw(renderRoot,rc)
rc.ctx.restore()
