import {TextBox} from "../textinput.js";

export function TextEditor() {
    return TextBox({
        // text:"hi there\some more text",
        fixedWidth: 200,
        fixedHeight: 200,
        multiline:true,
    })
}
