import {withInsets} from "./gfx.ts";
import {Insets} from "josh_js_util";
const LightStyle = {
    panelBackgroundColor: 'white',
}
const DarkStyle = {
    panelBackgroundColor: '#222',
    buttonBorderColor: '#666',
    textColor: '#fff',
    panelBorderColor: '#333',
    buttonBackground: "#333",
    buttonTextColor: '#fff',
}

const BaseStyle = {
    fontSize: '16px',
    font: '16px sans-serif',

    textColor: 'black',
    borderRadius: withInsets(0),

    panelMargin: withInsets(0),
    panelBorderColor: 'black',
    panelBorderWidth: withInsets(0),
    panelPadding: withInsets(0),
    panelBackgroundColor: 'white',
    panelBorderRadius: withInsets(4),

    buttonBackground: "white",
    buttonTextColor: 'black',

    buttonMargin: withInsets(4),
    buttonBorderColor: 'black',
    buttonBorderWidth: withInsets(1),
    buttonPadding: withInsets(7),
    buttonBorderRadius: withInsets(4),
    buttonBackgroundHoverColor: '#ccc',

    tagBorderRadius: withInsets(16),
    tabButtonBorderRadius: new Insets(5,5,0,0),
    tabButtonBorderWidth: new Insets(1,1,0,1),

    selectedBackgroundColor: 'hsl(35,100%,50%)',
    selectedBackgroundHoverColor: 'hsl(35,100%,70%)',
}
// export const Style = {...BaseStyle,...DarkStyle};
export type CompleteStyle = {
    textColor:string,
    backgroundColor:string,
}
export const Style = {...BaseStyle,...LightStyle};


