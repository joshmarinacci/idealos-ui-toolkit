import {ElementSettings, GElement, GRenderNode, LayoutConstraints, TRANSPARENT, VisualStyle, ZERO_INSETS,} from "./base.js";
import {RenderContext} from "./gfx.js";
import {Style} from "./style.js";
import {Insets, Point, Size} from "josh_js_util";
import {KEY_VENDOR} from "./keys.js";
import {getTotalInsets} from "./util.js";

type TextElementSettings = {
    multiline?:boolean
    wrapping?:boolean
    fixedWidth?:number
    bold?:boolean
    text:string
    visualStyle:VisualStyle
} & ElementSettings

export class TextElement implements GElement {
    settings: TextElementSettings;

    constructor(settings: TextElementSettings) {
        this.settings = settings
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        if(this.settings.fixedWidth || this.settings.wrapping) return this.layout_wrapping(rc,cons)
        if(this.settings.multiline) return this.layout_multiline(rc,cons);
        return this.layout_single_line_no_wrapping(rc,cons)
    }

    private layout_multiline(rc: RenderContext, _cons: LayoutConstraints) {
        // rc.ctx.font = calcCanvasFont(this.settings.fontSettings)
        let key = KEY_VENDOR.getKey()
        let [textsize,baseline] = this.calcMetrics(rc)
        let lineHeight = textsize.h
        let lines = this.settings.text.split('\n')
        let y = 0
        let total_insets = getTotalInsets(this.settings)
        let size = new Size(0,0)
        size.w = textsize.w
        size.h = textsize.h
        if(this.settings.fixedWidth) {
            size.w = this.settings.fixedWidth
        }
        let nodes:GRenderNode[] = lines.map(line => {
            let [m,_b] = rc.surface.measureText(line, {
                fontSize: this.settings.fontSettings?.fontSize,
                fontFamily: this.settings.fontSettings?.font
            })
            let pos = new Point(total_insets.left, total_insets.top+ y)
            y += lineHeight
            return new GRenderNode({
                key:key,
                shadow:true,
                kind:"text-line-element",
                text:line,
                font: Style.base().font,
                size: new Size(m.w,lineHeight),
                pos: pos,
                contentOffset: new Point(0,0),
                baseline: baseline,
                visualStyle: {
                    textColor: Style.base().textColor,
                    borderColor: TRANSPARENT,
                    background: TRANSPARENT,
                },
                padding: ZERO_INSETS,
                borderWidth: ZERO_INSETS,
                children: []
            })
        })

        size = size.growInsets(total_insets)
        return new GRenderNode({
            ... this.settings,
            key:key,
            kind: "text-multiline-element",
            text:"",
            font: Style.base().font,
            size: size,
            pos: new Point(0, 0),
            contentOffset: new Point(total_insets.left, total_insets.top),
            baseline: baseline,
            children: nodes,
        })
    }

    private layout_wrapping(rc: RenderContext, _cons: LayoutConstraints) {
        let key = KEY_VENDOR.getKey()

        // rc.ctx.font = calcCanvasFont(this.settings.fontSettings)
        let [textsize, baseline] = this.calcMetrics(rc)
        let lineHeight = textsize.h
        let words = this.settings.text.split(' ')
        let x = 0
        let total_insets = getTotalInsets(this.settings)

        let size = new Size(0,0)
        if(this.settings.fixedWidth) {
            size.w = this.settings.fixedWidth as number
        } else {
            size.w = _cons.space.w
        }
        size.h = textsize.h
        size.w -= (total_insets.left + total_insets.right)
        size.h += (total_insets.top + total_insets.bottom)

        let lines:string[] = []
        let current_line = ""
        for(let word of words) {
            word = word + " "
            let [wsize,_wbaseline] = rc.surface.measureText(word,{
                fontSize: this.settings.fontSettings?.fontSize,
                fontFamily: this.settings.fontSettings?.font
            })
            // let word_width = rc.ctx.measureText(word).width
            let word_width = wsize.w
            if(x + word_width > size.w) {
                lines.push(current_line)
                current_line = word
                x = word_width
            } else {
                current_line += word
                x += word_width
            }
        }
        lines.push(current_line)
        let y = 0
        let nodes:GRenderNode[] = lines.map(line => {
            let [lsize,_lbaseline] = rc.surface.measureText(line,{
                fontSize: this.settings.fontSettings?.fontSize,
                fontFamily: this.settings.fontSettings?.font
            })
            let pos = new Point(total_insets.left, total_insets.top+ y)
            y += lineHeight
            return new GRenderNode({
                ... this.settings,
                key:key,
                kind:"text-line-element",
                shadow:true,
                text:line,
                font: Style.base().font,
                size: new Size(lsize.w,lineHeight),
                pos: pos,
                contentOffset: new Point(0,0),
                baseline: baseline,
                visualStyle: {
                    textColor: Style.base().textColor,
                    borderColor: TRANSPARENT,
                    background: TRANSPARENT,
                },
                padding: ZERO_INSETS,
                borderWidth: ZERO_INSETS,
                children: []
            })
        })

        size.h = y
        size = size.growInsets(total_insets)
        return new GRenderNode({
            key:key,
            kind: "text-multiline-element",
            text:"",
            font: Style.base().font,
            size: size,
            pos: new Point(0, 0),
            contentOffset: new Point(total_insets.left, total_insets.top),
            baseline: baseline,
            visualStyle: this.settings.visualStyle,
            children: nodes,
            padding: this.settings.padding,
            borderWidth: this.settings.borderWidth,
            shadow: this.settings.shadow,
        })

    }

    private calcMetrics(rc: RenderContext):[Size,number] {
        return rc.surface.measureText(this.settings.text, {
            fontFamily: this.settings.fontSettings?.font || 'sans-serif',
            fontSize: this.settings.fontSettings?.fontSize || 16,
        })
    }

    private layout_single_line_no_wrapping(rc: RenderContext, _cons: LayoutConstraints) {
        let key = KEY_VENDOR.getKey()
        let [size,baseline] = this.calcMetrics(rc)
        let ins = getTotalInsets(this.settings)
        size = size.growInsets(ins)
        return new GRenderNode({
            ...this.settings,
            kind: "text-singleline-element",
            font: Style.base().font,
            fontSize: this.settings.fontSettings?.fontSize || Style.base().fontSize,
            fontWeight: this.settings.bold?"bold":Style.base().fontWeight,
            size: size,
            pos: new Point(0, 0),
            contentOffset: new Point(ins.left, ins.top),
            baseline: baseline,
            children: [],
            key:key,
        })

    }
}

export function Label(opts: { text: string, shadow?: boolean, multiline?:boolean, bold?:boolean, fixedWidth?:number }) {
    return new TextElement({
        text: opts.text,
        visualStyle: {
            textColor: Style.base().textColor,
            borderColor: TRANSPARENT,
            background: TRANSPARENT,
        },
        padding: Insets.from(5),
        fontSettings: {
            font: Style.base().font,
            fontSize: Style.base().fontSize,
            fontWeight: Style.base().fontWeight,
        },
        borderWidth: ZERO_INSETS,
        shadow: opts.shadow ? opts.shadow : false,
        multiline: opts.multiline ? opts.multiline : false,
        bold: opts.bold,
        fixedWidth: opts.fixedWidth,
    })
}

export function WrappingLabel(param: { fixedWidth?: number; text: string, shadow?:boolean }) {
    return new TextElement({
        text: param.text,
        multiline: true,
        wrapping:true,
        shadow: param.shadow||false,
        padding: Style.button().padding,
        borderWidth: ZERO_INSETS,
        fontSettings: {
            font: Style.base().font,
            fontSize: Style.base().fontSize,
            fontWeight:  Style.base().fontWeight,
        },
        fixedWidth: param.fixedWidth,
        visualStyle: {
            borderColor: TRANSPARENT,
            background: TRANSPARENT,
            textColor: Style.base().textColor,
        }
    })
}
