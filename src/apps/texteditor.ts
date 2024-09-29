import {TextBox} from "../textinput.js";
import {Style} from "../style.js";

export function TextEditor() {
    return TextBox({
        fixedWidth: 300,
        fixedHeight: 300,
        multiline:true,
        fontSettings: {
            fontSize: 30,
            font: Style.base().font,
            fontWeight: Style.base().fontWeight,
        }
    })
}
