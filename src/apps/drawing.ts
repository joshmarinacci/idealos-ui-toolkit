import {ObjMap, Schema} from "rtds-core";
import {Bounds, Insets, Point, Size} from "josh_js_util";
import {ListItemRenderer, ListView, ListViewItem} from "../listView.js";
import {GElement, GRenderNode, LayoutConstraints, RenderCallback, ZERO_INSETS, ZERO_POINT} from "../base.js";
import {Label} from "../text.js";
import {Button} from "../buttons.js";
import {AtomAsState, useRefresh} from "../util.js";
import {HBox, VBox} from "../layout.js";
import {KEY_VENDOR} from "../keys.js";
import {PropSheet} from "../propsheet.js";
import {RenderContext} from "../gfx.js";

const S = new Schema()

// const SPoint = S.jsobj(new Point(0,0))
const Position = S.jsobj(new Point(50, 50), {
    typeName: 'Position',
    fromJson: (j) => Point.fromJSON(j),
})
const SizeAtom = S.jsobj(new Size(25, 25), {
    typeName: 'Size',
    fromJson: (j) => Size.fromJSON(j),
})
type SizeType = typeof SizeAtom

const Color = S.map({
    r: S.number(0),
    g: S.number(0),
    b: S.number(0),
})
const Rect = S.map({
    position: Position,
    size: SizeAtom,
    name: S.string('unnamed rect'),
    fill: Color,
}, {typeName: 'Rect'})
type RectType = typeof Rect

const Circle = S.map({
    position: Position,
    radius: S.number(),
    name: S.string('unnamed circle'),
    fill: Color,
}, {typeName: 'Circle'})

const Doc = S.map({
    open: S.boolean(),
    selected: S.number(),
    shapes: S.list(Rect),
}, {typeName: 'Doc'})
type DocType = typeof Doc

const doc = Doc.clone()
doc.get('open').set(true)

const RED = Color.cloneWith({r: 1, g: 0, b: 0,})
const WHITE = Color.cloneWith({r: 1, g: 1, b: 1,})
const BLACK = Color.cloneWith({r: 0, g: 0, b: 0,})
const rect = Rect.cloneWith({
    position: new Point(50, 50),
    size: new Size(50, 50),
    fill: RED,
})
doc.get('shapes').push(rect)

const RenderShapeNode: ListItemRenderer<RectType> = (item, selected, index, onSelectedChanged): GElement => {
    return ListViewItem({
        children: [
            Label({text: item.get('name').get(), shadow: true}),
        ],
        selected: selected == index,
        mainAxisLayout: 'start',
        handleEvent: (e) => {
            if (e.type === 'mouse-down') {
                onSelectedChanged(index, e)
            }
        }
    })

}

function addRect(doc: DocType) {
    const rect = Rect.clone()
    rect.get('name').set('next rect')
    doc.get('shapes').pushLast(rect)
}

function addCircle(doc: DocType) {
    const circle = Circle.clone()
    circle.get('name').set('next circle')
    doc.get('shapes').pushLast(circle as RectType)
}

function Toolbar() {
    return HBox({
        children: [
            Button({
                text: 'add rect', handleEvent: (e) => {
                    if (e.type === 'mouse-down') {
                        addRect(doc)
                    }
                }
            }),
            Button({
                text: 'add circle', handleEvent: (e) => {
                    if (e.type === 'mouse-down') {
                        addCircle(doc)
                    }
                }
            }),
        ]
    })
}

function DocTree() {
    // return TreeView2({
    //     root:doc,
    //     fixedWidth: 200,
    //     canOpen:(item:unknown) => {
    //         let obj = item as Obj<unknown>
    //         if(obj.typeName() === 'page') {
    //             return true
    //         }
    //         if(obj.typeName() === 'doc') {
    //             return true
    //         }
    //         return false
    //     },
    //     isOpen:(item:unknown) => {
    //         let obj = item as Obj<unknown>
    //         if(obj.typeName() === 'Page') {
    //             return (obj as typeof Page).get('open').get()
    //         }
    //         if(obj.typeName() === 'Doc') {
    //             return (obj as typeof Doc).get('open').get()
    //         }
    //         return false
    //     },
    //     getChildren:(item:unknown):unknown[] => {
    //         let obj = item as Obj<unknown>
    //         if(obj.typeName() === 'Doc') {
    //             let arr:unknown[] = [];
    //             (obj as typeof Doc).get('shapes').forEach(item => {
    //                 arr.push(item)
    //             })
    //             return arr
    //         }
    //         if(obj.typeName() === 'Page') {
    //             let arr:unknown[] = [];
    //             (obj as typeof Page).get('shapes').forEach(item => {
    //                 arr.push(item)
    //             })
    //             return arr
    //         }
    //         return []
    //     },
    //     nodeRenderer:RenderShapeNode
    // })
    return VBox({
        fixedWidth: 150,
        borderWidth: Insets.from(1),
        visualStyle: {
            borderColor: "black",
        },
        children: [
            ListView({
                data: doc.get('shapes'),
                renderItem: RenderShapeNode,
                selected: AtomAsState(doc.get('selected')),
            })
        ]
    })
}


type CanvasElementSettings = {
    fixedWidth: number
    fixedHeight: number
    borderWidth:Insets
    background:string
    borderColor:string
    render: RenderCallback
}
class CanvasElement implements GElement {
    settings: CanvasElementSettings
    constructor(settings:CanvasElementSettings) {
        this.settings = settings
    }
    layout(_rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        const key = KEY_VENDOR.getKey()
        return new GRenderNode({
            font: "",
            key:key,
            kind:'canvas',
            size: new Size(this.settings.fixedWidth, this.settings.fixedHeight),
            pos: ZERO_POINT.copy(),
            children:[],
            borderWidth: this.settings.borderWidth,
            visualStyle: {
                background:this.settings.background,
                borderColor: this.settings.borderColor,
            },
            padding: ZERO_INSETS.copy(),
            baseline: 0,
            contentOffset: ZERO_POINT.copy(),
            renderCallback:this.settings.render
        })
    }
}


function fillToColor(fill: typeof Color) {
    return `rgb(${fill.get('r').get()*255}, ${fill.get('g').get()*255}, ${fill.get('b').get()*255})`
}

function doRender(ctx:RenderContext, doc:DocType) {
    let shapes = doc.get('shapes')
    shapes.forEach((shape) => {
        console.log(shape.typeName())
        if(shape.typeName() === 'Rect') {
            let rect = shape as typeof Rect
            let size = rect.get('size').get()
            let pos = rect.get('position').get()
            let fill:typeof Color = rect.get('fill')
            // console.log("fill is",fill.get('r').get(),fill.get('g').get(),fill.get('b').get())
            let color = fillToColor(fill)
            console.log("color is",color)
            ctx.surface.fillRect(Bounds.fromPointSize(pos,size),color)
        }
        if(shape.typeName() === 'Circle') {
            let circ = shape as typeof Circle
            let pos = circ.get('position')
            let rad = circ.get('radius')
            let fill:typeof Color = rect.get('fill')
            // let color = fillToColor(fill)
            // ctx.surface.fillArc(pos,rad,color)
        }
    })
}

function CanvasArea(doc: DocType) {
    return new CanvasElement({
        fixedWidth: 200,
        fixedHeight: 200,
        borderWidth: Insets.from(5),
        background: '#f0f0f0',
        borderColor: 'green',
        render:(rc) => doRender(rc,doc),
    })
}

export function DrawingApp() {
    const key = KEY_VENDOR.getKey()
    useRefresh(key, doc.get('shapes'))
    const sel_index = doc.get('selected').get()
    const rect = doc.get('shapes').get(sel_index)
    return VBox({
        mainAxisSelfLayout: 'grow',
        crossAxisSelfLayout: 'grow',
        children: [
            Toolbar(),
            HBox({
                crossAxisSelfLayout:'grow',
                children: [
                    DocTree(),
                    CanvasArea(doc),
                    PropSheet(rect as ObjMap<any>),
                ]
            })
        ]
    })
}
