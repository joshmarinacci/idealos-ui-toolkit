import {withInsets} from "./gfx.js";
import {Insets} from "josh_js_util";
import {ZERO_INSETS} from "./base.js";
// @ts-ignore
const DarkStyle = {
    panelBackgroundColor: '#222',
    buttonBorderColor: '#666',
    textColor: '#fff',
    panelBorderColor: '#333',
    buttonBackground: "#333",
    buttonTextColor: '#fff',
}
//
// const BaseStyle = {
//     fontSize: '24px',
//     font: '24px sans-serif',
//
//     textColor: 'black',
//     borderRadius: withInsets(0),
//
//     panelMargin: withInsets(0),
//     panelBorderColor: 'black',
//     panelBorderWidth: withInsets(0),
//     panelPadding: withInsets(0),
//     panelBackgroundColor: 'white',
//     panelBorderRadius: withInsets(4),
//
//     buttonBackground: "white",
//     buttonTextColor: 'black',
//
//     buttonMargin: withInsets(4),
//     buttonBorderColor: 'black',
//     buttonBorderWidth: withInsets(1),
//     buttonPadding: withInsets(7),
//     buttonBorderRadius: withInsets(4),
//     buttonBackgroundHoverColor: '#ccc',
//
//     tagBorderRadius: withInsets(16),
//     tabButtonBorderRadius: new Insets(5,5,0,0),
//     tabButtonBorderWidth: new Insets(1,1,0,1),
//
//     selectedBackgroundColor: 'hsl(35,100%,50%)',
//     selectedBackgroundHoverColor: 'hsl(35,100%,70%)',
// }
export type ComponentStyle = {
    backgroundColor:string,
    borderColor:string,
    textColor:string,
    font:string
    margin:Insets
    padding:Insets
    borderWidth:Insets
    borderRadius: Insets
    hoverBackgroundColor:string
}
// export const Style = {...BaseStyle,...DarkStyle};
// export type CompleteStyle = {
//     textColor:string,
//     backgroundColor:string,
// }
// export const Style = {...BaseStyle,...LightStyle};

const lightBaseComponentStyle:ComponentStyle = {
    backgroundColor: "white",
    borderColor: 'black',
    borderRadius: withInsets(0),
    borderWidth: withInsets(0),
    font: '24px sans-serif',
    margin: ZERO_INSETS,
    padding: ZERO_INSETS,
    textColor: 'black',
    hoverBackgroundColor:'white'
}
const lightButtonStyle:ComponentStyle = {
    backgroundColor: "white",
    borderColor: 'black',
    borderRadius: withInsets(4),
    borderWidth: withInsets(1),
    font: '24px sans-serif',
    margin: withInsets(4),
    padding: withInsets(7),
    textColor: 'black',
    hoverBackgroundColor: '#ccc',
}
const lightSelectedButtonStyle:ComponentStyle = {
    backgroundColor: 'hsl(35,100%,50%)',
    hoverBackgroundColor: 'hsl(35,100%,70%)',
    borderColor: 'black',
    borderRadius: withInsets(4),
    borderWidth: withInsets(1),
    font: '24px sans-serif',
    margin: withInsets(4),
    padding: withInsets(7),
    textColor: 'black',
}

class GlobalStyle {
    base():ComponentStyle {
        return lightBaseComponentStyle
    }
    button():ComponentStyle {
        return lightButtonStyle
    }
    selectedButton():ComponentStyle {
        return lightSelectedButtonStyle
    }
    panel():ComponentStyle {
        return lightBaseComponentStyle
    }
    toggle() {

    }
}

export const Style = new GlobalStyle()
