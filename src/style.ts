// light style
// export const Style = {
//     fontSize: '16px',
//     font: '16px sans-serif',
//
//     textColor: '#fff',
//     borderRadius: 0,
//
//     panelMargin: withInsets(0),
//     panelBorderColor: '#333',
//     panelBorderWidth: withInsets(0),
//     panelPadding: withInsets(0),
//     panelBackgroundColor: '#222',
//     panelBorderRadius: 4,
//
//     buttonBackground: "#333",
//     buttonTextColor: '#fff',
//
//     buttonMargin: withInsets(4),
//     buttonBorderColor: '#666',
//     buttonBorderWidth: withInsets(1),
//     buttonPadding: withInsets(7),
//     buttonBorderRadius: 4,
//
//     tagBorderRadius: 16
//
//
// }
// dark style
import {withInsets} from "./gfx.ts";
import {Insets} from "josh_js_util";
import {TRANSPARENT, ZERO_INSETS} from "./base.ts";

export const Style = {
    fontSize: '16px',
    font: '16px sans-serif',

    textColor: 'black',
    borderRadius: 0,

    panelMargin: withInsets(0),
    panelBorderColor: 'black',
    panelBorderWidth: withInsets(0),
    panelPadding: withInsets(0),
    panelBackgroundColor: 'white',
    panelBorderRadius: 4,

    buttonBackground: "white",
    buttonTextColor: 'black',

    buttonMargin: withInsets(4),
    buttonBorderColor: 'black',
    buttonBorderWidth: withInsets(1),
    buttonPadding: withInsets(7),
    buttonBorderRadius: 4,

    tagBorderRadius: 16,

    selectedBackgroundColor: 'orange',


}
export type BorderStyle = {
    borderColor: string
    borderWidth: Insets
    borderRadius: number|undefined
}
export const NULL_BORDER_STYLE: BorderStyle = {
    borderColor: TRANSPARENT,
    borderWidth: ZERO_INSETS,
    borderRadius: 0
}
