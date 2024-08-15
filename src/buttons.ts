import {Icons} from "./icons.ts";
import {Icon, TextElement} from "./comps2.ts";
import {GElement, Style, TRANSPARENT, ZERO_INSETS} from "./base.ts";
import {MHBoxElement} from "./layout.ts";

export function IconButton(param: { icon: Icons; text: string, ghost:boolean }) {
    return new MHBoxElement({
        background: param.ghost ? TRANSPARENT : Style.buttonBackground,
        borderColor: Style.panelBorderColor,
        borderWidth: param.ghost ? ZERO_INSETS : Style.buttonBorderWidth,
        children: [
            new Icon({icon: param.icon}),
            new TextElement({
                padding: ZERO_INSETS,
                font: Style.font,
                margin: ZERO_INSETS,
                borderColor: 'transparent',
                borderWidth: ZERO_INSETS,
                backgroundColor: param.ghost ? TRANSPARENT : Style.buttonBackground,
                text: param.text
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

export function Button(param: { text: string }): GElement {
    return new MHBoxElement({
        background: Style.buttonBackground,
        borderColor: "",
        borderWidth: Style.buttonBorderWidth,
        children: [new TextElement({
            padding: ZERO_INSETS,
            font: Style.font,
            margin: ZERO_INSETS,
            borderColor: 'transparent',
            borderWidth: ZERO_INSETS,
            backgroundColor: Style.buttonBackground,
            text: param.text
        })],
        crossAxisLayout: 'center',
        crossAxisSelfLayout: 'shrink',
        mainAxisLayout: 'center',
        mainAxisSelfLayout: 'shrink',
        margin: Style.buttonMargin,
        padding: Style.buttonPadding,

    })
}
