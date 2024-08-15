import {makeCanvas} from "./util.ts";
import {Bounds, Insets, Point, Size} from "josh_js_util";

const canvas = makeCanvas(new Size(600,300))
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


/*

    make hbox layout account for width of the text child
    don't double scale
    implement stretching for child by wrapping in Expander()
    make hbox fill space or not
    debug render margin box
    debug render padding box
    render border box
    make background only be inside of the border box

 */
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
interface GElement {
    layout(rc:RenderContext, space:Size):GRenderNode
}

type ElementSettings = {
    text:string
    padding:Insets
    margin:Insets
    borderWidth:Insets
    borderColor: string
}
class TextElement implements GElement {
    settings: ElementSettings;
    constructor(settings:ElementSettings) {
        this.settings = settings
    }

    layout(rc: RenderContext, _space:Size):GRenderNode {
        let metrics = rc.ctx.measureText(this.settings.text)
        let size = new Size(metrics.width, metrics.fontBoundingBoxAscent+metrics.fontBoundingBoxDescent)
        return new GRenderNode({
            id:"text element",
            text: this.settings.text,
            font: Style.font,
            size: size,
            pos: new Point(0, 0),
            baseline: metrics.emHeightAscent + metrics.emHeightDescent,
            background:'transparent',
            children:[],
        })
    }
}

let ZERO_INSETS = new Insets(0,0,0,0);
function MText(param: { padding: Insets; text: string }) {
    return new TextElement({
        text:param.text,
        padding: param.padding,
        margin: ZERO_INSETS,
        borderColor: 'black',
        borderWidth: new Insets(1,1,1,1)
    })
}

class SquareElement implements GElement {
    private size: number;
    private fill: string;
    constructor(number: number, fill: string) {
        this.size = number
        this.fill = fill
    }

    layout(_rc: RenderContext, _space: Size): GRenderNode {
        return new GRenderNode({
            id:'square',
            text: "",
            background: this.fill,
            size: new Size(this.size, this.size),
            pos: new Point(0, 0),
            baseline: 0,
            font: Style.font,
            children:[],
        })
    }

}

function Square(number: number, red: string):GElement {
    return new SquareElement(number,red)
}

class MHBoxElement implements GElement {
    private children: GElement[];
    constructor(param: { children: GElement[] }) {
        this.children = param.children
    }

    layout(rc: RenderContext, space: Size): GRenderNode {
        const children = this.children.map(ch => {
            return ch.layout(rc,space)
        })
        let x = 0
        for(let ch of children) {
            ch.settings.pos.x = x
            x += ch.settings.size.w
        }
        return new GRenderNode({
            background: 'white',
            baseline: 0,
            font: Style.font,
            pos: new Point(0,0),
            size: new Size(100,100),
            text: "hbox",
            id:"mhbox",
            children:children
        })
    }

}

function MHBox(param: { children: GElement[] }):GElement {
    return new MHBoxElement(param)
}

function makeTree():GElement {
    return MHBox({
        children:[
            Square(50,"red"),
            MText({
                text:"some text",
                padding: new Insets(5,5,5,5)
            }),
            Square(50,"green"),
        ]
    })
}

type RenderNodeSettings = {
    text: string;
    background: string | undefined,
    font: string;
    size: Size;
    pos: Point;
    baseline: number;
    id:string,
    children:GRenderNode[]
}
class GRenderNode {
    settings: RenderNodeSettings;

    constructor(settings: {
        size: Size;
        pos: Point;
        background: string;
        baseline: number;
        text: string;
        id: string;
        font: string
        children: GRenderNode[];
    }) {
        this.settings = settings
    }
}
function doLayout(e:GElement, rc:RenderContext):GRenderNode {
    return e.layout(rc, rc.size)
}

function fillRect(ctx: CanvasRenderingContext2D, bounds: Bounds, background: string) {
    ctx.fillStyle = background
    ctx.fillRect(bounds.x, bounds.y, bounds.w,bounds.h);
}

function debugText(rc: RenderContext, id: string, pos: Point) {
    rc.ctx.font = '10px sans-serif'
    rc.ctx.fillStyle = 'aqua'
    rc.ctx.fillText(id,pos.x,pos.y)
}

function doDraw(n:GRenderNode, rc:RenderContext):void {
    console.log("drawing",n.settings.id, n.settings.pos)
    rc.ctx.save()
    rc.ctx.translate(n.settings.pos.x, n.settings.pos.y)
    // fill bg
    if(n.settings.background) {
        let size = n.settings.size
        fillRect(rc.ctx,
            Bounds.fromPointSize(new Point(0,0),size),
            n.settings.background)
    }

    // draw text
    if(n.settings.text) {
        rc.ctx.fillStyle = 'black'
        rc.ctx.font = n.settings.font
        rc.ctx.textRendering = 'optimizeLegibility'
        rc.ctx.textAlign = 'start'
        rc.ctx.textBaseline = 'alphabetic'
        rc.ctx.fillText(n.settings.text, 0, 0 + n.settings.baseline)
    }

    n.settings.children.forEach(ch => {
        doDraw(ch,rc)
    })

    if(rc.debug.metrics) {
        // draw the baseline
        rc.ctx.fillStyle = 'purple'
        rc.ctx.fillRect(0,0+n.settings.baseline,n.settings.size.w,1)
        debugText(rc,n.settings.id,new Point(5,10))
    }
    rc.ctx.restore()
}

const elementRoot = makeTree()
const renderRoot = doLayout(elementRoot,rc)
rc.ctx.save()
rc.ctx.scale(rc.scale, rc.scale)
// rc.ctx.translate(10,10)
rc.ctx.fillStyle = '#f0f0f0'
rc.ctx.fillRect(0,0,rc.size.w,rc.size.h);
doDraw(renderRoot,rc)
rc.ctx.restore()
