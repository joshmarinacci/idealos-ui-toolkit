import {MHBoxElement, MVBoxElement} from "./layout.js";
import {Button} from "./buttons.js";
import {Insets} from "josh_js_util";
import {GElement, StateHandler, useState} from "./base.js";
import {Style} from "./style.js";
import {KEY_VENDOR} from "./keys.js";

export type TabbedBoxOptions = {
    titles: string[],
    children: GElement[],
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
                borderWidth: new Insets(0,0,1,0),
                visualStyle: {
                    textColor:Style.base().textColor,
                    borderColor: Style.base().borderColor,
                    background: Style.panel().backgroundColor,
                },
                padding: new Insets(5,0,0,0),
                children: opts.titles.map(((title, i) => {
                    return Button({
                        key:'tab-title-'+title,
                        text: title,
                        selected: selected == i,
                        borderRadius: new Insets(5,5,0,0),
                        borderWidth: new Insets(1,1,0,1),
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
