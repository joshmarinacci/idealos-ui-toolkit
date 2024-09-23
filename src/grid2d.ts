import {AGrid2D} from "rtds-core";
import {Point, Size} from "josh_js_util";
import {GElement, GRenderNode, LayoutConstraints, ZERO_INSETS, ZERO_POINT} from "./base.js";
import {RenderContext} from "./gfx.js";
import {KEY_VENDOR} from "./keys.js";
import {useRefresh} from "./util.js";

type Grid2DViewOptions<T> = {
    scale: number
    data: AGrid2D<T>
    drawLines: boolean;
    renderCell: (grid: AGrid2D<T>, cell: T, index: Point, scale: number) => GElement;
}

class Grid2DViewElement<T> implements GElement {
    private opts: Grid2DViewOptions<T>;

    constructor(opts: Grid2DViewOptions<T>) {
        this.opts = opts
    }

    layout(rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        const key = KEY_VENDOR.getKey()
        // useRefresh(key, this.opts.data)
        let children: GRenderNode[] = []
        this.opts.data.forEach((v, n) => {
            const view = this.opts.renderCell(this.opts.data, v, n, this.opts.scale)
            let node = view.layout(rc, {
                space: new Size(this.opts.scale, this.opts.scale),
                layout: "grow"
            })
            node.settings.pos = n.scale(this.opts.scale)
            children.push(node)
        })
        return new GRenderNode({
            key: key,
            kind: "grid-cell",
            baseline: 0,
            children: children,
            contentOffset: ZERO_POINT,
            font: "",
            pos: new Point(0, 0),
            size: new Size(this.opts.scale * this.opts.data.width, this.opts.scale * this.opts.data.height),
            padding: ZERO_INSETS,
            visualStyle: {
                borderColor: "red",
                background: "white",
                textColor: "black"
            }
        })
    }
}

export function Grid2DView<T>(opts: Grid2DViewOptions<T>) {
    return new Grid2DViewElement(opts)
}
