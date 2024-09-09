import {Obj, ObjMap, Schema} from "rtds-core";
import {Insets, Point, Size} from "josh_js_util";
import {ListViewItem} from "./listView.js";
import {GElement, GRenderNode, LayoutConstraints, StateHandler} from "./base.js";
import {RenderContext} from "./gfx.js";
import {Label} from "./text.js";
import {ToggleIconButton} from "./buttons.js";
import {Icons} from "./icons.js";
import {AtomAsState} from "./util.js";

const S = new Schema()

const SPoint = S.jsobj(new Point(0,0))
const SSize = S.jsobj(new Size(0,0))

const Color = S.map({
    r:S.number(0),
    g:S.number(0),
    b:S.number(0),
})
const Rect = S.map({
    position:SPoint,
    size:SSize,
    fill:Color,
},{typeName:'Rect'})

const Circle = S.map({
    position:SPoint,
    radius: S.number(),
    fill:Color,
},{typeName:'Circle'})

const Page = S.map({
    title: S.string(),
    open: S.boolean(),
    shapes: S.list(Rect),
    background: Color,
},{typeName:'Page'})

const Doc = S.map({
    open: S.boolean(),
    pages:S.list(Page)
},{ typeName:'Doc'})

const doc = Doc.clone()
doc.get('open').set(true)
const page1 = Page.cloneWith({
    title: "page 1",
})
doc.get('pages').push(page1)
const page2 = Page.cloneWith({
    title: "page 2",
})
const RED = Color.cloneWith({ r:1, g:0, b:0,})
const WHITE = Color.cloneWith({ r:1, g:1, b:1,})
const BLACK = Color.cloneWith({ r:0, g:0, b:0,})
const rect = Rect.cloneWith({
    position: new Point(50,50),
    size: new Size(50,50),
    fill:RED,
})
page2.get('shapes').push(rect)
page2.set('background',BLACK)
doc.get('pages').push(page2)

function renderNode(item:unknown) {
    let it = item as Obj<any>
    let text = "???"
    let opened:StateHandler<boolean> = {
        get:() => false,
        set:(v) => {},
    }
    if(it.typeName() === 'Doc') {
        text = "doc"
        opened = AtomAsState((it as typeof Doc).get('open'))
    }
    if(it.typeName() === 'Page') {
        text = 'page'
        opened = AtomAsState((it as typeof Page).get('open'))
    }
    if(it.typeName() === 'Rect') {
        text = 'rect'
    }
    return ListViewItem({
        selected: false,
        children: [
            ToggleIconButton({
                selectedIcon:Icons.KeyboardArrowDown,
                unselectedIcon: Icons.KeyboardArrowRight,
                selected:opened,
                text:""
            }),
            Label({text:text})
        ],
        handleEvent:(e) => {
            console.log("event happened",e)
        }
    })
}

type TreeViewOptions = {
    fixedWidth: number
    isOpen: (item:unknown) => boolean
    root: unknown
    canOpen: (item:unknown) => boolean
    // isChildren:(item:unknown, name:string) => boolean
    getChildren:(item:unknown) => unknown[]
    nodeRenderer: (item:unknown) => GElement
}

class TreeView2Element implements GElement {
    private opts: TreeViewOptions;
    constructor(opts:TreeViewOptions) {
        this.opts = opts
    }
    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        const root = this.opts.root as ObjMap<any>
        let children = this.make_child(root, rc, {
            layout:'grow',
            space: new Size(this.opts.fixedWidth,200)
        }, new Point(0,0))
        console.log("child count",children.length)
        return new GRenderNode({
            baseline: 0,
            children: children,
            padding: Insets.from(5),
            contentOffset: new Point(0,0),
            font: "",
            key: "",
            kind: "tree-view",
            pos: new Point(0,0),
            size: new Size(this.opts.fixedWidth,200),
            visualStyle: {
                background: "green",
                borderColor: "blue",
                textColor:"black"
            }
        })
    }

    private make_child(root: ObjMap<any>, rc: RenderContext, cons: LayoutConstraints, pos:Point):GRenderNode[] {
        let children:GRenderNode[] = []
        const item_elem = this.opts.nodeRenderer(root)
        let item_node = item_elem.layout(rc, cons)
        item_node.settings.pos = pos.copy()
        children.push(item_node)

        console.log("is open",root,this.opts.isOpen(root))
        if(this.opts.isOpen(root)) {
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
function TreeView2(opts: TreeViewOptions) {
    return new TreeView2Element(opts)
}

export function DrawingApp() {
    return TreeView2({
        root:doc,
        fixedWidth: 200,
        canOpen:(item:unknown) => {
            let obj = item as Obj<unknown>
            if(obj.typeName() === 'page') {
                return true
            }
            if(obj.typeName() === 'doc') {
                return true
            }
            return false
        },
        isOpen:(item:unknown) => {
            let obj = item as Obj<unknown>
            if(obj.typeName() === 'Page') {
                return (obj as typeof Page).get('open').get()
            }
            if(obj.typeName() === 'Doc') {
                return (obj as typeof Doc).get('open').get()
            }
            return false
        },
        getChildren:(item:unknown):unknown[] => {
            let obj = item as Obj<unknown>
            if(obj.typeName() === 'Doc') {
                let arr:unknown[] = [];
                (obj as typeof Doc).get('pages').forEach(item => {
                    arr.push(item)
                })
                return arr
            }
            if(obj.typeName() === 'Page') {
                let arr:unknown[] = [];
                (obj as typeof Page).get('shapes').forEach(item => {
                    arr.push(item)
                })
                return arr
            }
            return []
        },
        nodeRenderer:renderNode
    })
}
