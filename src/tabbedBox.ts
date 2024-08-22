import {MHBoxElement, MVBoxElement} from "./layout.ts";
import {Button} from "./buttons.ts";
import {withInsets} from "./gfx.ts";
import {Insets} from "josh_js_util";
import {CEvent, ZERO_INSETS} from "./base.ts";
import {Style} from "./style.ts";

export type TabbedBoxOptions = {
    titles: string[],
    children: MVBoxElement[],
    selectedTab:number
    onSelectedChanged(i: number, e:CEvent): void;
}
export function TabbedBox(opts: TabbedBoxOptions) {
    return new MVBoxElement({
        mainAxisSelfLayout: "grow",
        mainAxisLayout: "center",
        crossAxisLayout: "center",
        crossAxisSelfLayout: "grow",
        children: [
            new MHBoxElement({
                id:'tabbed-titles',
                mainAxisSelfLayout: "grow",
                mainAxisLayout: "start",
                crossAxisLayout: "end",
                crossAxisSelfLayout: "shrink",
                borderWidth: withInsets(1),
                padding: new Insets(5,0,0,0),
                margin: ZERO_INSETS,
                children: opts.titles.map(((title, i) => {
                    return Button({
                        text: title,
                        selected: opts.selectedTab == i,
                        margin: new Insets(0,2,0,2),
                        borderRadius: Style.tabButtonBorderRadius,
                        borderWidth: Style.tabButtonBorderWidth,
                        handleEvent:(e) => {
                            opts.onSelectedChanged(i,e)
                        }
                    });
                })),
            }),
            opts.children[opts.selectedTab]
        ]
    })

}
