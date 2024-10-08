import {GElement, GRenderNode, LayoutConstraints, ZERO_INSETS, ZERO_POINT} from "./base.js";
import {RenderContext} from "./gfx.js";
import {Insets, Point, Size} from "josh_js_util";
import {Style} from "./style.js";
import {KEY_VENDOR} from "./keys.js";

class SquareElement implements GElement {
    private size: number;
    private fill: string;

    constructor(number: number, fill: string) {
        this.size = number
        this.fill = fill
    }

    layout(_rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        let key = KEY_VENDOR.getKey()
        KEY_VENDOR.startElement(this)
        let node = new GRenderNode({
            kind: 'square',
            text: "",
            visualStyle: {
                background: this.fill,
                borderColor:'magenta',
                textColor:'magenta'
            },
            size: new Size(this.size, this.size),
            pos: new Point(0, 0),
            baseline: this.size/2,
            font: Style.base().font,
            children: [],
            borderWidth: ZERO_INSETS,
            padding: ZERO_INSETS,
            contentOffset:ZERO_POINT,
            key:key
        })
        KEY_VENDOR.endElement(this)
        return node
    }

}

export function Square(number: number, fill: string): GElement {
    return new SquareElement(number, fill)
}
export function FilledRect(size:Size, fill:string):GRenderNode {
    let key = KEY_VENDOR.getKey()
    return new GRenderNode({
        kind: 'square',
        text: "",
        visualStyle: {
            background: fill,
            borderColor: 'green',
            textColor: 'magenta'
        },
        size: size.copy(),
        pos: new Point(0, 0),
        baseline: 0,
        font: Style.base().font,
        children: [],
        borderWidth: Insets.from(1),
        padding: ZERO_INSETS,
        contentOffset: ZERO_POINT,
        key: key
    })
}

export class HSeparator implements GElement {
    constructor() {
    }
    layout(_rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        let key = KEY_VENDOR.getKey()
        return new GRenderNode({
            key:key,
            visualStyle:{
                background: "#aaa",
                borderColor: "",
                textColor: ""
            },
            baseline: 0,
            borderWidth: ZERO_INSETS,
            children: [],
            contentOffset: ZERO_POINT,
            font: "",
            kind: "separator",
            padding: ZERO_INSETS,
            pos: ZERO_POINT,
            size: new Size(20, 32),
            text: "",
        })
    }

}
