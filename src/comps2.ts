import {GElement, GRenderNode, LayoutConstraints, ZERO_INSETS, ZERO_POINT} from "./base.ts";
import {RenderContext} from "./gfx.ts";
import {Point, Size} from "josh_js_util";
import {Style} from "./style.ts";
import {KEY_VENDOR} from "./keys.ts";


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
                borderColor:'black',
                textColor:'black'
            },
            size: new Size(this.size, this.size),
            pos: new Point(0, 0),
            baseline: this.size/2,
            font: Style.font,
            children: [],
            margin: ZERO_INSETS,
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

export class HSeparator implements GElement {
    layout(_rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        return new GRenderNode({
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
            kind: "",
            margin: Style.buttonMargin,
            padding: ZERO_INSETS,
            pos: ZERO_POINT,
            size: new Size(20, 32),
            text: "",
        })
    }

}
