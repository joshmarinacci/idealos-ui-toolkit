import {withInsets} from "./gfx.ts";
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
    buttonBackgroundHoverColor: '#ccc',

    tagBorderRadius: 16,

    selectedBackgroundColor: 'hsl(35,100%,50%)',
    selectedBackgroundHoverColor: 'hsl(35,100%,70%)',
}
// export const Style = {...BaseStyle,...DarkStyle};
export type CompleteStyle = {
    textColor:string,
    backgroundColor:string,
}
export const Style = {...BaseStyle,...LightStyle};


