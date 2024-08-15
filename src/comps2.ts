import {AxisLayout, AxisSelfLayout, ElementSettings, GElement, GRenderNode, LayoutConstraints} from "./base.ts";
import {RenderContext, sizeWithPadding, withInsets} from "./gfx.ts";
import {Bounds, Insets, Point, Size} from "josh_js_util";

export const Style = {
    fontSize: '16px',
    font: '16px plain sans-serif',

    textColor: 'red',

    panelMargin: withInsets(0),
    panelBorderColor: '#333',
    panelBorderWidth: withInsets(1),
    panelPadding: withInsets(5),
    panelBackgroundColor: '#bbb',

}

export class TextElement implements GElement {
    settings: ElementSettings;

    constructor(settings: ElementSettings) {
        this.settings = settings
    }

    layout(rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        rc.ctx.font = this.settings.font
        let metrics = rc.ctx.measureText(this.settings.text)
        let size = new Size(
            Math.floor(metrics.width),
            Math.floor(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent))
        size = sizeWithPadding(size,this.settings.padding)
        return new GRenderNode({
            id: "text element",
            text: this.settings.text,
            font: Style.font,
            size: size,
            pos: new Point(0, 0),
            contentOffset: new Point(this.settings.padding.left,this.settings.padding.top),
            baseline: metrics.emHeightAscent + metrics.emHeightDescent,
            background: this.settings.backgroundColor,
            children: [],
            padding: this.settings.padding,
            margin: this.settings.margin,
            borderWidth: ZERO_INSETS,
            textColor:Style.textColor,
            borderColor:'gray'
        })
    }
}

export const ZERO_INSETS = new Insets(0, 0, 0, 0);
export const ZERO_POINT = new Point(0,0)

// export function MText(param: { padding: Insets; text: string }) {
//     return new TextElement({
//         text: param.text,
//         padding: param.padding,
//         margin: ZERO_INSETS,
//         borderColor: 'black',
//         borderWidth: ZERO_INSETS,
//         font: Style.font,
//         backgroundColor: 'transparent',
//     })
// }

class SquareElement implements GElement {
    private size: number;
    private fill: string;

    constructor(number: number, fill: string) {
        this.size = number
        this.fill = fill
    }

    layout(_rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        return new GRenderNode({
            id: 'square',
            text: "",
            background: this.fill,
            size: new Size(this.size, this.size),
            pos: new Point(0, 0),
            baseline: this.size/2,
            font: Style.font,
            children: [],
            margin: ZERO_INSETS,
            borderWidth: ZERO_INSETS,
            padding: ZERO_INSETS,
            contentOffset:ZERO_POINT,
            borderColor:'black',
            textColor:'black'
        })
    }

}

export function Square(number: number, red: string): GElement {
    return new SquareElement(number, red)
}

type MHBoxParameters = {
    mainAxisSelfLayout: AxisSelfLayout,
    crossAxisSelfLayout: AxisSelfLayout,
    mainAxisLayout: AxisLayout,
    children: GElement[],
    background: string,
    padding: Insets
    margin: Insets,
    borderWidth: Insets,
    borderColor: string
}

function bdsSubInsets(bds: Bounds, insets: Insets) {
    return new Bounds(
        bds.x + insets.left,
        bds.y + insets.top,
        bds.w - insets.left - insets.right,
        bds.h - insets.top - insets.bottom,
    )
}

export class MHBoxElement implements GElement {
    private settings: MHBoxParameters;

    constructor(param: MHBoxParameters) {
        this.settings = param
    }

    layout(rc: RenderContext, cons:LayoutConstraints): GRenderNode {
        this.log(`space ${cons}`)
        let chs = this.settings.children
        let map = new Map<GElement,GRenderNode>()
        let expanders = chs.filter(ch => ch instanceof Expander)
        let non_expanders = chs.filter(ch => !(ch instanceof Expander))
        this.log(`exp ${expanders.length} non = ${non_expanders.length}`)

        // layout non expander children
        const non_expander_children = chs.map(ch => {
            let node = ch.layout(rc,{space:cons.space})
            map.set(ch,node)
            return node
        })
        let min_width = 0
        let max_height = 0
        for (let ch of non_expander_children) {
            min_width += ch.settings.size.w
            max_height = Math.max(max_height, ch.settings.size.h)
        }
        let contentBounds = new Bounds(0,0,0,0)
        if (this.settings.mainAxisSelfLayout === 'grow') {
            contentBounds.w = cons.space.w
        } else {
            contentBounds.w = min_width
        }
        if(this.settings.crossAxisSelfLayout === 'grow') {
            contentBounds.h = cons.space.h
        } else {
            contentBounds.h = 100
        }

        this.log('content bounds', contentBounds)
        // let leftover = contentBounds.w - min_width
        // this.log("leftover is",leftover)
        // let expander_count = expanders.length
        // this.log("expander count",expander_count)
        chs.map(ch => {
            let ndoe = ch.layout(rc,{space:cons.space})
            map.set(ch,ndoe)
            return ndoe
        })
        // let h = (this.settings.crossAxisSelfLayout === 'grow') ? space.h : y
        this.log("started content bounds",contentBounds)
        // subtract padding
        contentBounds = bdsSubInsets(contentBounds,this.settings.margin)
        contentBounds = bdsSubInsets(contentBounds,this.settings.borderWidth)
        contentBounds = bdsSubInsets(contentBounds,this.settings.padding)
        this.log("after insets",contentBounds)
        let x = contentBounds.x
        if (this.settings.mainAxisLayout === 'start') {
            x = contentBounds.x
        }
        if (this.settings.mainAxisLayout === 'center') {
            x = (contentBounds.w - min_width) / 2
        }
        if (this.settings.mainAxisLayout === 'end') {
            x = contentBounds.w - min_width
        }
        // this.log("hbox padding", contentBounds)

        // do final position of children
        let y = contentBounds.y
        let children = this.settings.children.map(ch => map.get(ch) as GRenderNode)
        for (let ch of children) {
            // console.log('ch',ch.settings.id,'size',ch.settings.size)
            ch.settings.pos.x = x
            ch.settings.pos.y = contentBounds.y
            x += ch.settings.size.w
            y = Math.max(ch.settings.size.h, y)
        }
        // let w = (this.settings.mainAxisSelfLayout === 'grow')?space.w:x
        // let h = (this.settings.crossAxisSelfLayout === 'grow') ? space.h : y
        // let size = new Size(contentBounds.w, h)
        // size = sizeWithPadding(size,this.settings.padding)
        let size = contentBounds.size()
        size = sizeWithPadding(size,this.settings.margin)
        size = sizeWithPadding(size,this.settings.borderWidth)
        size = sizeWithPadding(size,this.settings.padding)
        this.log("final size",size)
        return new GRenderNode({
            background: this.settings.background,
            baseline: 0,
            font: Style.font,
            pos: new Point(0, 0),
            size: size,
            text: "",
            id: "mhbox",
            children: children,
            padding: this.settings.padding,
            contentOffset: contentBounds.position(),
            borderColor:'black',
            margin: this.settings.margin,
            textColor:'black',
            borderWidth: this.settings.borderWidth
        })
    }

    private log(...output:any[]   ) {
        console.log("HBox", ...output)
    }
}

export class Expander implements GElement {
    layout(_rc: RenderContext, _cons:LayoutConstraints): GRenderNode {
        return new GRenderNode({
            baseline: 0,
            borderColor: "",
            borderWidth: ZERO_INSETS,
            children: [],
            font: "",
            id: "",
            margin: ZERO_INSETS,
            padding: ZERO_INSETS,
            pos: ZERO_POINT,
            size: new Size(20,20),
            text: "",
            textColor: "",
            background: 'cyan',
            contentOffset: new Point(0, 0)
        })
    }
}
