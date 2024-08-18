import {CEvent, GElement, GRenderNode, LayoutConstraints, MKeyboardEvent} from "./base.ts";
import {RenderContext, sizeWithPadding, withInsets} from "./gfx.ts";
import {Style} from "./style.ts";
import {Insets, Point, Size} from "josh_js_util";
import {addInsets} from "./util.ts";

type OnChangeCallback<T> = (value: T, e: CEvent) => void
type TextInputSettings = {
    text: string
    inputid: string
    onChange: OnChangeCallback<string>
}
type TextInputRequirements = {
    text: string
    inputid: string
    onChange: OnChangeCallback<string>
    margin: Insets
    padding: Insets
    borderWidth: Insets
}

class TextInputElement implements GElement {
    private opts: TextInputRequirements

    constructor(opts: TextInputSettings) {
        this.opts = {
            ...opts,
            borderWidth: withInsets(1),
            margin: Style.buttonMargin,
            padding: Style.buttonPadding,
        }
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        // console.log("redoing layout",this.opts.text)
        rc.ctx.font = Style.font
        let metrics = rc.ctx.measureText(this.opts.text)
        let size = new Size(
            Math.floor(metrics.width),
            Math.floor(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent))
        size = sizeWithPadding(size, this.opts.padding)
        size = sizeWithPadding(size, this.opts.margin)
        size = sizeWithPadding(size, this.opts.borderWidth)
        size.w = 100
        let total_insets = addInsets(addInsets(this.opts.margin, this.opts.borderWidth), this.opts.padding)
        return new GRenderNode({
            id: 'text-input',
            inputid: this.opts.inputid,
            text: this.opts.text,
            visualStyle: {
                background: '#f0f0f0',
                borderColor: '#aaa',
                textColor: 'black',
            },
            focusedStyle: {
                background: '#fff',
                borderColor: 'black'
            },
            baseline: metrics.emHeightAscent + metrics.emHeightDescent,
            borderWidth: this.opts.borderWidth,
            children: [],
            contentOffset: new Point(total_insets.left, total_insets.top),
            font: Style.font,
            margin: this.opts.margin,
            padding: this.opts.padding,
            pos: new Point(0, 0),
            size: size,
            clip: true,
            handleEvent: (e) => {
                if (e.type === 'keyboard-typed') {
                    console.log("typed", e)
                    let kbe = e as MKeyboardEvent;
                    this.opts.onChange(this.opts.text + kbe.key, e)
                }
            }
        })
    }

}

export function TextBox(param: TextInputSettings): GElement {
    return new TextInputElement(param)
}
