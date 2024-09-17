import {ObjAtom, ObjMap} from "rtds-core";
import {Insets, Point, Size} from "josh_js_util";
import {HBox, VBox} from "./layout.js";
import {Label} from "./text.js";
import {TextBox} from "./textinput.js";
import {GElement} from "./base.js";
import {AtomAsState} from "./util.js";

export function PointEditor(atom: ObjAtom<Point>) {
    const updatePointX = {
        get: (): string => {
            return atom.get().x + ""
        },
        set: (v: string): void => {
            let pt = atom.get()
            pt = new Point(parseInt(v), pt.y)
            atom.set(pt)
        }
    }
    const updatePointY = {
        get: (): string => {
            return atom.get().y + ""
        },
        set: (v: string): void => {
            let pt = atom.get()
            pt = new Point(pt.x, parseInt(v))
            atom.set(pt)
        }
    }
    return VBox({
        mainAxisSelfLayout: 'shrink',
        children: [
            EditorRow([
                Label({text: "x", fixedWidth:50}),
                TextBox({text: updatePointX})
            ]),
            EditorRow([
                Label({text: "y", fixedWidth:50}),
                TextBox({text: updatePointY})
            ]),
        ]
    })
}

export function SizeEditor(atom: ObjAtom<Size>) {
    const updateW = {
        get: (): string => {
            return atom.get().w + ""
        },
        set: (v: string): void => {
            let a = atom.get()
            a = new Size(parseInt(v), a.h)
            atom.set(a)
        }
    }
    const updateH = {
        get: (): string => {
            return atom.get().h + ""
        },
        set: (v: string): void => {
            let a = atom.get()
            a = new Size(a.w, parseInt(v))
            atom.set(a)
        }
    }
    return VBox({
        mainAxisSelfLayout: 'shrink',
        children: [
            EditorRow([
                Label({text: "w", fixedWidth:50}),
                TextBox({text: updateW})
            ]),
            EditorRow([
                Label({text: "h", fixedWidth:50}),
                TextBox({text: updateH})
            ]),
        ]
    })
}

export function GetEditorForAtom(obj: ObjAtom<unknown>): GElement {
    if (obj.getAtomType() === 'object') {
        if (obj.typeName() === 'Position') return PointEditor(obj as ObjAtom<Point>)
        if (obj.typeName() === 'Size') return SizeEditor(obj as ObjAtom<Size>)
    }
    if (obj.getAtomType() === 'number') {
        let atom = obj as ObjAtom<number>
        return TextBox({
            multiline: false,
            text: {
                get: () => atom.get() + "",
                set: (v) => atom.set(parseInt(v))
            }
        })
    }
    if (obj.getAtomType() === 'string') {
        return TextBox({
            multiline: false,
            text: AtomAsState(obj as ObjAtom<string>),
        })
    }
    return Label({text: "unknown type"})
}

function EditorRow(chs: GElement[]) {
    return HBox({
        borderWidth: Insets.from(1),
        visualStyle: {
            background: "aqua",
            borderColor: "red",
            textColor: "black",
        },
        mainAxisLayout: 'start',
        mainAxisSelfLayout: 'grow',
        children: chs
    })
}

export function PropSheet(rect: ObjMap<unknown> | undefined) {
    let children: GElement[] = []
    if (rect) {
        children = rect.getPropNames().map(prop => {
            let obj = rect.get(prop) as ObjAtom<any>
            if (obj.objType() === 'atom') {
                return EditorRow([
                    Label({text: prop, fixedWidth: 100}),
                    GetEditorForAtom(obj as ObjAtom<unknown>)
                ])
            }
            return EditorRow([Label({text: 'unsupported property'})])
        })
    }
    return VBox({
        fixedWidth: 300,
        mainAxisLayout: 'start',
        borderWidth: Insets.from(1),
        padding: Insets.from(3),
        visualStyle: {
            background: '#f0f0f0',
            borderColor: 'black',
        },
        children: children,
    })
}
