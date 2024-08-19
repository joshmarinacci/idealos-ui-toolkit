import {HBox} from "../layout.ts";
import {ScrollContainer} from "../scroll.ts";
import {Point} from "josh_js_util";
import {ListView} from "../listView.ts";

const state = {
    scrollOffset:new Point(0,0),
    selectedItem: 0
}
export function EmailDemo() {
    const lv = ListView({
        data:["a","b",'C','d','e','f','g','h','i','j','k'],
        selected: state.selectedItem,
        onSelectedChanged:(a,e) => {
            state.selectedItem = a
            e.redraw()
        }
    })
    return HBox({
        children: [
            ScrollContainer({
                fixedWidth:300,
                fixedHeight:200,
                scrollOffset: state.scrollOffset,
                child: lv,
                onScrollChanged: (p,e) => {
                    state.scrollOffset = p
                    e.redraw()
                }
            })
        ]
    })
}
