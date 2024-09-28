import {AxisSelfLayout, GElement, GRenderNode, LayoutConstraints, ZERO_POINT} from "./base.js";
import {RenderContext} from "./gfx.js";
import {KEY_VENDOR} from "./keys.js";
import {Bounds, Logger, make_logger} from "josh_js_util";
import {Style} from "./style.js";

type GridColumn = {
    fixedWidth?: number
}
type GridRow = {
    fixedHeight?: number
}
type GridBoxOptions = {
    fixedWidth?: number
    fixedHeight?: number
    mainAxisSelfLayout?: AxisSelfLayout,
    crossAxisSelfLayout?: AxisSelfLayout,
    children: GElement[],
    columns: GridColumn[],
    rows: GridRow[],
}

class GridBoxElement implements GElement {
    private settings: GridBoxOptions;
    private log: Logger;

    constructor(opts: GridBoxOptions) {
        this.settings = opts
        this.log = make_logger("GRID_BOX")
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        this.log.info("layout", cons)
        const key = KEY_VENDOR.getKey()
        const boxes: GRenderNode[] = []

        let y = 0
        for (let j = 0; j < this.settings.rows.length; j++) {
            let row = this.settings.rows[j];
            let x = 0
            let h_leftover = cons.space.h - y
            for (let i = 0; i < this.settings.columns.length; i++) {
                let w_leftover = cons.space.w - x
                const rect = new Bounds(0, 0, 0, 0)
                rect.x = x
                rect.y = y
                let col = this.settings.columns[i]
                if (col.fixedWidth) {
                    rect.w = col.fixedWidth
                    x += col.fixedWidth
                } else {
                    rect.w = w_leftover
                }
                if (row.fixedHeight) {
                    rect.h = row.fixedHeight
                } else {
                    rect.h = h_leftover
                }
                const index = j * this.settings.columns.length + i
                // console.log("index", index)
                const child = this.settings.children[index]
                // console.log("child", child)
                const node = child.layout(rc, {
                    space: rect.size(),
                    layout: "grow",
                })
                node.settings.pos = rect.position().copy()
                // node.settings.size = rect.size().copy()
                // console.log("node", node.settings.kind, node.settings.pos, node.settings.size)
                boxes.push(node)
            }
            if (row.fixedHeight) {
                y += row.fixedHeight
            }
        }
        return new GRenderNode({
            key: key,
            baseline: 0,
            children: boxes,
            contentOffset: ZERO_POINT,
            font: "",
            kind: "grid-box",
            pos: ZERO_POINT.copy(),
            size: cons.space.copy(),
            padding: Style.panel().padding,
            visualStyle: {
                background: "magenta",
                textColor: Style.base().textColor,
                borderColor: Style.button().borderColor
            }
        })
    }
}

export function GridBox(opts: GridBoxOptions) {
    return new GridBoxElement(opts)
}
