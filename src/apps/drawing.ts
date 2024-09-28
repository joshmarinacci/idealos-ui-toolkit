import {ObjMap, Schema} from "rtds-core";
import {Insets, Point, Size} from "josh_js_util";
import {ListItemRenderer, ListView, ListViewItem} from "../listView.js";
import {GElement} from "../base.js";
import {Label} from "../text.js";
import {Button} from "../buttons.js";
import {AtomAsState, useRefresh} from "../util.js";
import {HBox, VBox} from "../layout.js";
import {KEY_VENDOR} from "../keys.js";
import {PropSheet} from "../propsheet.js";

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
        mainAxisLayout: 'end',
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
        fixedWidth: 100,
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

function CanvasArea() {
    return HBox({
        fixedWidth: 400,
        fixedHeight: 200,
        borderWidth: Insets.from(5),
        visualStyle: {
            background: '#f0f0f0',
            borderColor: 'green'
        },
        children: [
            Label({text: "canvas area"})
        ]
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
                // crossAxisLayout:'center',
                children: [
                    DocTree(),
                    CanvasArea(),
                    PropSheet(rect as ObjMap<any>),
                ]
            })
        ]
    })
}
