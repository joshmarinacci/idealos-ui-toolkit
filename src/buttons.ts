import {Icons} from "./icons.ts";
import {Icon, TextElement} from "./comps2.ts";
import {GElement, TRANSPARENT, ZERO_INSETS} from "./base.ts";
import {MHBoxElement} from "./layout.ts";
import {Style} from "./style.ts";
import {Insets} from "josh_js_util";

export function IconButton(param: { icon: Icons; text: string, ghost:boolean }) {
    return new MHBoxElement({
        background: param.ghost ? TRANSPARENT : Style.buttonBackground,
        borderColor: Style.buttonBorderColor,
        borderWidth: param.ghost ? ZERO_INSETS : Style.buttonBorderWidth,
        borderRadius: Style.buttonBorderRadius,
        children: [
            new Icon({icon: param.icon, shadow:true}),
            new TextElement({
                padding: ZERO_INSETS,
                font: Style.font,
                margin: ZERO_INSETS,
                borderColor: TRANSPARENT,
                borderWidth: ZERO_INSETS,
                backgroundColor: TRANSPARENT,
                text: param.text,
                textColor: Style.buttonTextColor,
                shadow: true,
            }),
        ],
        crossAxisLayout: "center",
        crossAxisSelfLayout: "shrink",
        mainAxisLayout: "center",
        mainAxisSelfLayout: "shrink",
        margin: Style.buttonMargin,
        padding: Style.buttonPadding
    })
}

export const CheckBox = (p: { text: string }) => IconButton({text: p.text, icon: Icons.CheckboxUnchecked, ghost:true})
export const RadioButton = (p: { text: string }) => IconButton({text: p.text, icon: Icons.RadioButtonUnchecked, ghost:true})

export function Button(param: { margin?: Insets; text: string; selected?: boolean }): GElement {
    return new MHBoxElement({
        id:'button',
        background: param.selected?Style.selectedBackgroundColor:Style.buttonBackground,
        borderColor: Style.buttonBorderColor,
        borderWidth: Style.buttonBorderWidth,
        borderRadius: Style.buttonBorderRadius,
        children: [new TextElement({
            padding: ZERO_INSETS,
            font: Style.font,
            margin: ZERO_INSETS,
            borderColor: TRANSPARENT,
            borderWidth: ZERO_INSETS,
            backgroundColor: TRANSPARENT,
            text: param.text,
            textColor: Style.buttonTextColor,
            shadow: true,
        })],
        crossAxisLayout: 'center',
        crossAxisSelfLayout: 'shrink',
        mainAxisLayout: 'center',
        mainAxisSelfLayout: 'shrink',
        margin: param.margin||Style.buttonMargin,
        padding: Style.buttonPadding,
    })
}
