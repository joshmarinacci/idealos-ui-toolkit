import {MHBoxElement, MVBoxElement} from "./layout.js";
import {Button} from "./buttons.js";
import {withInsets} from "./gfx.js";
import {Insets} from "josh_js_util";
import {StateHandler, useState, ZERO_INSETS} from "./base.js";
import {Style} from "./style.js";
import {KEY_VENDOR} from "./keys.js";

export type TabbedBoxOptions = {
    titles: string[],
    children: MVBoxElement[],
    selected?:StateHandler<number>
}
export function TabbedBox(opts: TabbedBoxOptions) {
    let key = KEY_VENDOR.getKey()
    let [selected, setSelected] = useState<number>(key,"selected",opts.selected,()=>0)
    return new MVBoxElement({
        key:key,
        mainAxisSelfLayout: "grow",
        mainAxisLayout: "center",
        crossAxisLayout: "center",
        crossAxisSelfLayout: "grow",
        children: [
            new MHBoxElement({
                kind:'tabbed-titles',
                mainAxisSelfLayout: "grow",
                mainAxisLayout: "start",
                crossAxisLayout: "end",
                crossAxisSelfLayout: "shrink",
                borderWidth: withInsets(1),
                padding: new Insets(5,0,0,0),
                margin: ZERO_INSETS,
                children: opts.titles.map(((title, i) => {
                    return Button({
                        key:'tab-title-'+title,
                        text: title,
                        selected: selected == i,
                        margin: new Insets(0,2,0,2),
                        borderRadius: Style.tabButtonBorderRadius,
                        borderWidth: Style.tabButtonBorderWidth,
                        handleEvent:(e) => {
                            if(e.type === 'mouse-down') {
                                setSelected(i)
                                e.redraw()
                            }
                        }
                    });
                })),
            }),
            opts.children[selected]
        ]
    })

}
