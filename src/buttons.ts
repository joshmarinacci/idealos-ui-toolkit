import {Icon, Icons} from "./icons.ts";
import {EventHandler, GElement, TRANSPARENT, VisualStyle, ZERO_INSETS} from "./base.ts";
import {MHBoxElement} from "./layout.ts";
import {Style} from "./style.ts";
import {Insets} from "josh_js_util";
import {TextElement} from "./text.ts";

type ButtonParameters = {
    margin?:Insets,
    text?:string,
    selected?:boolean
    handleEvent?: EventHandler
    borderRadius?: Insets
}
type IconButtonParameters = {
    icon: Icons
    ghost?: boolean
    hoverStyle?:VisualStyle
} & ButtonParameters;

export function IconButton(opts: IconButtonParameters) {
    return new MHBoxElement({
        visualStyle: {
            borderColor:opts.ghost ? TRANSPARENT : Style.buttonBorderColor,
            background: opts.ghost ? TRANSPARENT : Style.buttonBackground,
            textColor: Style.buttonTextColor,
        },
        hoverStyle: opts.hoverStyle || {
            background: Style.buttonBackground,
            borderColor: Style.buttonBorderColor,
            textColor: Style.buttonTextColor,
        },
        borderWidth: opts.ghost ? Style.buttonBorderWidth : Style.buttonBorderWidth,
        borderRadius: opts.borderRadius || Style.buttonBorderRadius,
        children: [
            new Icon({icon: opts.icon, shadow:true}),
            new TextElement({
                padding: ZERO_INSETS,
                font: Style.font,
                margin: ZERO_INSETS,
                visualStyle:{
                    borderColor: TRANSPARENT,
                    background: TRANSPARENT,
                    textColor: Style.buttonTextColor,
                },
                borderWidth: ZERO_INSETS,
                text: opts.text || "",
                shadow: true,
            }),
        ],
        crossAxisLayout: "center",
        crossAxisSelfLayout: "shrink",
        mainAxisLayout: "center",
        mainAxisSelfLayout: "shrink",
        margin: Style.buttonMargin,
        padding: Style.buttonPadding,
        handleEvent: opts.handleEvent,
    })
}

const NULL_HOVER:VisualStyle = {
    borderColor:TRANSPARENT,
}
export const CheckBox = (p: ButtonParameters) => IconButton({
    icon: p.selected?Icons.CheckboxChecked:Icons.CheckboxUnchecked,
    hoverStyle: NULL_HOVER,
    ghost:true, ...p
})
export const RadioButton = (p: ButtonParameters) => IconButton({
    icon: p.selected?Icons.RadioButtonUnchecked:Icons.RadioButtonChecked,
    hoverStyle: NULL_HOVER,
    ghost:true, ...p
})

export function Button(opts: ButtonParameters ):GElement {
    return new MHBoxElement({
        id:'button',
        visualStyle: {
            background: opts.selected?Style.selectedBackgroundColor:Style.buttonBackground,
            borderColor: Style.buttonBorderColor,
            textColor: Style.buttonTextColor,
        },
        hoverStyle: {
            background:opts.selected?Style.selectedBackgroundHoverColor:Style.buttonBackgroundHoverColor,
            borderColor: Style.buttonBorderColor,
            textColor: Style.buttonTextColor,
        },
        borderWidth: Style.buttonBorderWidth,
        borderRadius: opts.borderRadius || Style.buttonBorderRadius,
        children: [new TextElement({
            padding: ZERO_INSETS,
            font: Style.font,
            margin: ZERO_INSETS,
            visualStyle:{
                borderColor: TRANSPARENT,
                background: TRANSPARENT,
                textColor: Style.buttonTextColor,
            },
            borderWidth: ZERO_INSETS,
            text: opts.text || "",
            shadow: true,
        })],
        crossAxisLayout: 'center',
        crossAxisSelfLayout: 'shrink',
        mainAxisLayout: 'center',
        mainAxisSelfLayout: 'shrink',
        margin: opts.margin||Style.buttonMargin,
        padding: Style.buttonPadding,
        handleEvent: opts.handleEvent,
    })
}

export function Tag(opts: { text: string }) {
    return new MHBoxElement({
        visualStyle: {
            background: 'blue',
            borderColor: Style.buttonBorderColor,
            textColor: Style.textColor,
        },
        borderWidth: Style.buttonBorderWidth,
        borderRadius: Style.tagBorderRadius,
        children: [new TextElement({
            padding: ZERO_INSETS,
            font: Style.font,
            margin: ZERO_INSETS,
            visualStyle: {
                borderColor: 'transparent',
                background: TRANSPARENT,
                textColor: Style.buttonTextColor,
            },
            borderWidth: ZERO_INSETS,
            text: opts.text,
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
