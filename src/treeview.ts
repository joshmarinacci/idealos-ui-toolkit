import {GElement, GRenderNode, LayoutConstraints} from "./base.js";
import {RenderContext} from "./gfx.js";
import {ObjMap} from "rtds-core";
import {Insets, Point, Size} from "josh_js_util";

type TreeViewOptions = {
    fixedWidth: number
    isOpen: (item: unknown) => boolean
    root: unknown
    canOpen: (item: unknown) => boolean
    // isChildren:(item:unknown, name:string) => boolean
    getChildren: (item: unknown) => unknown[]
    nodeRenderer: (item: unknown) => GElement
}

class TreeView2Element implements GElement {
    private opts: TreeViewOptions;

    constructor(opts: TreeViewOptions) {
        this.opts = opts
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        const root = this.opts.root as ObjMap<any>
        let children = this.make_child(root, rc, {
            layout: 'grow',
            space: new Size(this.opts.fixedWidth, 200)
        }, new Point(0, 0))
        console.log("child count", children.length)
        return new GRenderNode({
            baseline: 0,
            children: children,
            padding: Insets.from(5),
            contentOffset: new Point(0, 0),
            font: "",
            key: "",
            kind: "tree-view",
            pos: new Point(0, 0),
            size: new Size(this.opts.fixedWidth, 200),
            visualStyle: {
                background: "green",
                borderColor: "blue",
                textColor: "black"
            }
        })
    }

    private make_child(root: ObjMap<any>, rc: RenderContext, cons: LayoutConstraints, pos: Point): GRenderNode[] {
        let children: GRenderNode[] = []
        const item_elem = this.opts.nodeRenderer(root)
        let item_node = item_elem.layout(rc, cons)
        item_node.settings.pos = pos.copy()
        children.push(item_node)

        // console.log("is open",root,this.opts.isOpen(root))
        if (this.opts.isOpen(root)) {
            let ch = this.opts.getChildren(root)
            let y = item_node.settings.size.h
            let x = 20
            ch.forEach(it2 => {
                let pos2 = pos.add(new Point(x, y))
                let chs = this.make_child(it2, rc, {
                    space: new Size(cons.space.w - 21, 200),
                    layout: 'grow',
                }, pos2)
                for (let ch of chs) {
                    y += ch.settings.size.h
                }
                children = children.concat(chs)
            })
        }
        return children
    }
}

export function TreeView2(opts: TreeViewOptions) {
    return new TreeView2Element(opts)
}
