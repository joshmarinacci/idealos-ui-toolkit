import {makeCanvas} from "./util.ts";
import {Insets, Point, Size} from "josh_js_util";

const canvas = makeCanvas(new Size(300,100))
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

type RenderContext = {
    size: Size;
    scale:number
    canvas:HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
    debug: {
        metrics: boolean
    },
}

const rc:RenderContext = {
    canvas:canvas,
    ctx: ctx,
    scale:2 * window.devicePixelRatio,
    debug:{
        metrics: true
    },
    size: new Size(canvas.width, canvas.height)
}

const Style = {
    fontSize:'16px',
    font:'16px plain sans-serif',
}
type ElementSettings = {
    text:string
    padding:Insets
    margin:Insets
    borderWidth:Insets
    borderColor: string
}
class GElement {
    settings: ElementSettings;
    constructor(settings:ElementSettings) {
        this.settings = settings
    }

    layout(rc: RenderContext, space:Size):GRenderNode {
        let metrics = rc.ctx.measureText(this.settings.text)
        let size = new Size(metrics.width, metrics.fontBoundingBoxAscent+metrics.fontBoundingBoxDescent)
        return new GRenderNode({
            text:this.settings.text,
            font:Style.font,
            size: size,
            pos: new Point(0,0),
            baseline:metrics.emHeightAscent + metrics.emHeightDescent,
        })
    }
}

let ZERO_INSETS = new Insets(0,0,0,0);
function MText(param: { padding: Insets; text: string }) {
    return new GElement({
        text:param.text,
        padding: param.padding,
        margin: ZERO_INSETS,
        borderColor: 'black',
        borderWidth: new Insets(1,1,1,1)
    })
}

function makeTree():GElement {
    return MText({
        text:"some text",
        padding: new Insets(5,5,5,5)
    })
}

type RenderNodeSettings = {
    text: string;
    font: string;
    size: Size;
    pos: Point;
    baseline: number;
}
class GRenderNode {
    settings: RenderNodeSettings;
    constructor(settings:RenderNodeSettings) {
        this.settings = settings
    }
}
function doLayout(e:GElement, rc:RenderContext):GRenderNode {
    return e.layout(rc, rc.size)
}

function doDraw(n:GRenderNode, rc:RenderContext):void {
    console.log("drawing",n)
    rc.ctx.fillStyle = '#f0f0f0'
    rc.ctx.fillRect(0,0,rc.size.w,rc.size.h);

    // draw text
    rc.ctx.fillStyle = 'black'
    rc.ctx.font = n.settings.font
    rc.ctx.textRendering = 'optimizeLegibility'
    rc.ctx.textAlign = 'start'
    rc.ctx.textBaseline = 'alphabetic'
    rc.ctx.fillText(n.settings.text, n.settings.pos.x, n.settings.pos.y + n.settings.baseline)

    if(rc.debug.metrics) {
        rc.ctx.save()
        rc.ctx.fillStyle = 'purple'
        rc.ctx.fillRect(n.settings.pos.x,n.settings.pos.y+n.settings.baseline,100,1)
        rc.ctx.restore()
    }
}

const elementRoot = makeTree()
const renderRoot = doLayout(elementRoot,rc)
rc.ctx.save()
rc.ctx.scale(rc.scale, rc.scale)
// rc.ctx.translate(10,10)
doDraw(renderRoot,rc)
rc.ctx.restore()
