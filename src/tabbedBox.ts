import {MHBoxElement, MVBoxElement} from "./layout.ts";
import {Button} from "./buttons.ts";
import {withInsets} from "./gfx.ts";
import {Style} from "./style.ts";
import {Insets} from "josh_js_util";
import {ZERO_INSETS} from "./base.ts";

export function TabbedBox(opts: { titles: string[], children: MVBoxElement[] }) {
    const selectedIndex = 0
    return new MVBoxElement({
        mainAxisSelfLayout: "grow",
        mainAxisLayout: "center",
        crossAxisLayout: "center",
        crossAxisSelfLayout: "grow",
        children: [
            new MHBoxElement({
                mainAxisSelfLayout: "grow",
                mainAxisLayout: "start",
                crossAxisLayout: "end",
                crossAxisSelfLayout: "shrink",
                borderColor:Style.panelBorderColor,
                borderWidth: withInsets(5),
                padding: new Insets(5,0,0,0),
                margin: ZERO_INSETS,
                children: opts.titles.map(((title, i) => {
                    return Button({
                        text: title, selected: selectedIndex == i,
                        margin: new Insets(0,2,0,2),
                    });
                })),
            }),
            opts.children[selectedIndex]
        ]
    })

}
