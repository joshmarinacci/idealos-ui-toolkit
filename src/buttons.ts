import {Icons} from "./icons.ts";
import {Icon, TextElement} from "./comps2.ts";
import {EventHandler, GElement, TRANSPARENT, ZERO_INSETS} from "./base.ts";
import {MHBoxElement} from "./layout.ts";
import {Style} from "./style.ts";
import {Insets} from "josh_js_util";

type ButtonParameters = {
    margin?:Insets,
    text?:string,
    selected?:boolean
    handleEvent?: EventHandler
}
type IconButtonParameters = {
    icon: Icons
    ghost?: boolean
} & ButtonParameters;

export function IconButton(opts: IconButtonParameters) {
    return new MHBoxElement({
        visualStyle: {
            borderColor:Style.buttonBorderColor,
            background: opts.ghost ? TRANSPARENT : Style.buttonBackground,
            textColor: Style.buttonTextColor,
        },
        borderWidth: opts.ghost ? ZERO_INSETS : Style.buttonBorderWidth,
        borderRadius: Style.buttonBorderRadius,
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

export const CheckBox = (p: ButtonParameters) => IconButton({
    icon: p.selected?Icons.CheckboxChecked:Icons.CheckboxUnchecked,
    ghost:true, ...p
})
export const RadioButton = (p: ButtonParameters) => IconButton({
    icon: p.selected?Icons.RadioButtonUnchecked:Icons.RadioButtonChecked,
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
        borderWidth: Style.buttonBorderWidth,
        borderRadius: Style.buttonBorderRadius,
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
