import {ElementSettings, GElement, GRenderNode, LayoutConstraints, TRANSPARENT, ZERO_INSETS, ZERO_POINT} from "./base.ts";
import {RenderContext, sizeWithPadding, withInsets} from "./gfx.ts";
import {Point, Size} from "josh_js_util";
import {Icons} from "./icons.ts";
import {MHBoxElement} from "./layout.ts";
import {Style} from "./style.ts";

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
        size = sizeWithPadding(size,this.settings.margin)
        size = sizeWithPadding(size,this.settings.borderWidth)
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
            borderWidth: this.settings.borderWidth,
            textColor: this.settings.textColor,
            borderColor: this.settings.borderColor,
            shadow: this.settings.shadow,
        })
    }
}

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

export function Square(number: number, fill: string): GElement {
    return new SquareElement(number, fill)
}

export class Icon implements GElement {
    private icon: Icons;
    private shadow: boolean;
    constructor(opts:{icon:Icons, shadow?:boolean}) {
        this.icon = opts.icon
        this.shadow = opts.shadow || false
    }

    layout(_rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        return new GRenderNode({
            background: "",
            baseline: 24,
            borderColor: "",
            borderWidth: ZERO_INSETS,
            children: [],
            contentOffset: new Point(0,0),
            font: "24px material-icons",
            id: `icon: ${this.icon}`,
            margin: ZERO_INSETS,
            padding: ZERO_INSETS,
            pos: new Point(0,0),
            size: new Size(24,24),
            text: this.icon,
            textColor: Style.textColor,
            shadow: this.shadow
        })
    }
}

export function Label(opts: { text: string, shadow?:boolean }) {
    return new TextElement({
        text: opts.text,
        textColor: Style.textColor,
        padding: withInsets(5),
        font: Style.font,
        margin: withInsets(5),
        borderColor: TRANSPARENT,
        borderWidth: ZERO_INSETS,
        backgroundColor: TRANSPARENT,
        shadow: opts.shadow?opts.shadow:false
    })
}

export function Tag(opts: { text: string }) {
    return new MHBoxElement({
        background: 'blue',
        borderColor: Style.buttonBorderColor,
        borderWidth: Style.buttonBorderWidth,
        borderRadius: Style.tagBorderRadius,
        children: [new TextElement({
            padding: ZERO_INSETS,
            font: Style.font,
            margin: ZERO_INSETS,
            borderColor: 'transparent',
            borderWidth: ZERO_INSETS,
            backgroundColor: TRANSPARENT,
            text: opts.text,
            textColor: Style.buttonTextColor,
            shadow: true,
        })],
        crossAxisLayout: 'center',
        crossAxisSelfLayout: 'shrink',
        mainAxisLayout: 'center',
        mainAxisSelfLayout: 'shrink',
        margin: Style.buttonMargin,
        padding: Style.buttonPadding,
    })
}

export class HSeparator implements GElement {
    layout(_rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        return new GRenderNode({
            background: "#aaa",
            baseline: 0,
            borderColor: "",
            borderWidth: ZERO_INSETS,
            children: [],
            contentOffset: ZERO_POINT,
            font: "",
            id: "",
            margin: Style.buttonMargin,
            padding: ZERO_INSETS,
            pos: ZERO_POINT,
            size: new Size(20, 32),
            text: "",
            textColor: ""

        })
    }

}
