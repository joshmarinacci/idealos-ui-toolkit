import {GElement, GRenderNode, LayoutConstraints, TRANSPARENT, ZERO_INSETS} from "../base.ts";
import {RenderContext} from "../gfx.ts";
import {Point, Size} from "josh_js_util";
import {KEY_VENDOR} from "../keys.ts";

export class PopupContainer implements GElement {
    private child: GElement;

    constructor(param: { child: GElement }) {
        this.child = param.child
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        let child = this.child.layout(rc, cons)
        let key = KEY_VENDOR.getKey()
        return new GRenderNode({
            kind: "popup-container",
            key:key,
            size: new Size(100, 200),
            pos: new Point(100, 100),
            margin: ZERO_INSETS,
            padding: ZERO_INSETS,
            borderWidth: ZERO_INSETS,
            children: [child],
            contentOffset: new Point(0, 0),
            clip: false,
            baseline: 0,
            font: "",
            text: "",
            visualStyle: {
                textColor: TRANSPARENT,
                background: TRANSPARENT,
                borderColor: TRANSPARENT,
            },
            popup: true,
        })
    }

}
