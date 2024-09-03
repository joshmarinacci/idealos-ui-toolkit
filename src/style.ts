import {withInsets} from "./gfx.js";
import {Insets} from "josh_js_util";
import {TRANSPARENT, ZERO_INSETS} from "./base.js";
// @ts-ignore

const Colors = {
    lightBackground:'#fff',
    darkBackground: '#222',
    darkTextColor:'#fff',
    lightTextColor:'#000',
}

const FontInfo = {
    fontSize: 16,
    fontWeight:'normal',
    font:'sans-serif',
}

export const IconFontSize = 20

// const DarkStyle = {
//     panelBackgroundColor: '#222',
//     buttonBorderColor: '#666',
//     textColor: '#fff',
//     panelBorderColor: '#333',
//     buttonBackground: "#333",
//     buttonTextColor: '#fff',
// }

export type ComponentStyle = {
    backgroundColor:string,
    borderColor:string,
    textColor:string,
    font:string
    fontSize:number
    fontWeight:string
    padding:Insets
    borderWidth:Insets
    borderRadius: Insets
    hoverBackgroundColor:string
}

const lightBaseComponentStyle:ComponentStyle = {
    backgroundColor: Colors.lightBackground,
    borderColor: 'black',
    borderRadius: ZERO_INSETS,
    borderWidth: ZERO_INSETS,
    padding: ZERO_INSETS,
    textColor: 'black',
    hoverBackgroundColor:'white',
    ...FontInfo
}
const darkBaseComponentStyle:ComponentStyle = {
    backgroundColor: Colors.darkBackground,
    borderColor: 'white',
    borderRadius: ZERO_INSETS,
    borderWidth: ZERO_INSETS,
    padding: ZERO_INSETS,
    textColor: 'white',
    hoverBackgroundColor:'black',
    ...FontInfo
}

const lightButtonStyle:ComponentStyle = {
    backgroundColor: Colors.lightBackground,
    borderColor: 'black',
    borderRadius: withInsets(4),
    borderWidth: withInsets(1),
    padding: withInsets(7),
    textColor: 'black',
    hoverBackgroundColor: '#ccc',
    ...FontInfo
}
const darkButtonStyle:ComponentStyle = {
    backgroundColor: Colors.darkBackground,
    borderColor: 'white',
    borderRadius: withInsets(4),
    borderWidth: withInsets(1),
    ...FontInfo,
    padding: withInsets(7),
    textColor: 'white',
    hoverBackgroundColor: '#ccc',
}

const lightPanelStyle:ComponentStyle = {
    backgroundColor: Colors.lightBackground,
    borderColor: TRANSPARENT,
    borderRadius: withInsets(4),
    borderWidth: withInsets(1),
    ...FontInfo,
    padding: withInsets(0),
    textColor: 'black',
    hoverBackgroundColor: '#ccc',
}
const darkPanelStyle:ComponentStyle = {
    backgroundColor: Colors.darkBackground,
    borderColor: TRANSPARENT,
    borderRadius: withInsets(4),
    borderWidth: withInsets(0),
    ...FontInfo,
    padding: withInsets(0),
    textColor: 'white',
    hoverBackgroundColor: '#ccc',
}

const lightSelectedButtonStyle:ComponentStyle = {
    // backgroundColor: 'hsl(35,100%,50%)',
    backgroundColor:'#FF9500',
    // hoverBackgroundColor: 'hsl(35,100%,70%)',
    hoverBackgroundColor:'#FFBF66',
    borderColor: 'black',
    borderRadius: withInsets(4),
    borderWidth: withInsets(1),
    ...FontInfo,
    padding: withInsets(7),
    textColor: 'black',
}

class GlobalStyle {
    private _base: ComponentStyle;
    private _button: ComponentStyle;
    private _panel: ComponentStyle;
    constructor() {
        this._base = lightBaseComponentStyle
        this._button = lightButtonStyle
        this._panel = lightPanelStyle
    }
    base():ComponentStyle {
        return this._base
    }
    button():ComponentStyle {
        return this._button
    }
    selectedButton():ComponentStyle {
        return lightSelectedButtonStyle
    }
    panel():ComponentStyle {
        return this._panel
    }
    toggle() {
        if(this._base === lightBaseComponentStyle) {
            this._base = darkBaseComponentStyle
            this._button = darkButtonStyle
            this._panel = darkPanelStyle
        } else {
            this._base = lightBaseComponentStyle
            this._button = lightButtonStyle
            this._panel = lightPanelStyle
        }
    }
}

export const Style = new GlobalStyle()
