import {AxisLayout, AxisSelfLayout, ElementSettings, GElement, GRenderNode} from "./base.ts";
import {RenderContext} from "./gfx.ts";
import {Insets, Point, Size} from "josh_js_util";

const Style = {
    fontSize: '16px',
    font: '16px plain sans-serif',
}

class TextElement implements GElement {
    settings: ElementSettings;

    constructor(settings: ElementSettings) {
        this.settings = settings
    }

    layout(rc: RenderContext, _space: Size): GRenderNode {
        rc.ctx.font = this.settings.font
        let metrics = rc.ctx.measureText(this.settings.text)
        // console.log("font",rc.ctx.font)
        // console.log(`layout metrics "${this.settings.text}" => ${rc.ctx.measureText(this.settings.text).width}`)
        let size = new Size(metrics.width, metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)
        return new GRenderNode({
            id: "text element",
            text: this.settings.text,
            font: Style.font,
            size: size,
            pos: new Point(0, 0),
            baseline: metrics.emHeightAscent + metrics.emHeightDescent,
            background: 'transparent',
            children: [],
            padding: this.settings.padding
        })
    }
}

let ZERO_INSETS = new Insets(0, 0, 0, 0);

export function MText(param: { padding: Insets; text: string }) {
    return new TextElement({
        text: param.text,
        padding: param.padding,
        margin: ZERO_INSETS,
        borderColor: 'black',
        borderWidth: new Insets(1, 1, 1, 1),
        font: Style.font
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
            id: 'square',
            text: "",
            background: this.fill,
            size: new Size(this.size, this.size),
            pos: new Point(0, 0),
            baseline: 0,
            font: Style.font,
            children: [],
            padding: ZERO_INSETS
        })
    }

}

export function Square(number: number, red: string): GElement {
    return new SquareElement(number, red)
}

export class MHBoxElement implements GElement {
    private settings: MHBoxParameters;

    constructor(param: MHBoxParameters) {
        this.settings = param
    }

    layout(rc: RenderContext, space: Size): GRenderNode {
        const children = this.settings.children.map(ch => {
            return ch.layout(rc, space)
        })
        let min_width = 0
        for (let ch of children) {
            min_width += ch.settings.size.w
        }
        let w = 0
        if (this.settings.mainAxisSelfLayout === 'grow') {
            w = space.w
        } else {
            w = min_width
        }
        // console.log("min width is",min_width,`layout is ${this.settings.mainAxisLayout}`)
        // console.log("width is",w)
        let x = 0
        if (this.settings.mainAxisLayout === 'start') {
            x = 0
        }
        if (this.settings.mainAxisLayout === 'center') {
            x = (w - min_width) / 2
        }
        if (this.settings.mainAxisLayout === 'end') {
            x = w - min_width
        }
        let y = 0
        for (let ch of children) {
            // console.log('ch',ch.settings.id,'size',ch.settings.size)
            ch.settings.pos.x = x
            x += ch.settings.size.w
            y = Math.max(ch.settings.size.h, y)
        }
        // let w = (this.settings.mainAxisSelfLayout === 'grow')?space.w:x
        let h = (this.settings.crossAxisSelfLayout === 'grow') ? space.h : y
        let size = new Size(w, h)
        return new GRenderNode({
            background: this.settings.background,
            baseline: 0,
            font: Style.font,
            pos: new Point(0, 0),
            size: size,
            text: "",
            id: "mhbox",
            children: children,
            padding: ZERO_INSETS
        })
    }

}

type MHBoxParameters = {
    mainAxisSelfLayout: AxisSelfLayout,
    crossAxisSelfLayout: AxisSelfLayout,
    mainAxisLayout: AxisLayout,
    children: GElement[],
    background: string,
}
