import {ObjAtom, ObjMap} from "rtds-core";
import {Insets, Point, Size} from "josh_js_util";
import {HBox, VBox} from "./layout.js";
import {Label} from "./text.js";
import {TextBox} from "./textinput.js";
import {GElement, TRANSPARENT} from "./base.js";
import {AtomAsState} from "./util.js";
import {CheckBox} from "./buttons.js";
import {Style} from "./style.js";

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
        crossAxisSelfLayout: 'shrink',
        visualStyle: {
            background:TRANSPARENT
        },
        children: [
            EditorRow([
                Label({text: "x", fixedWidth: 50}),
                TextBox({text: updatePointX, fixedWidth: 100}),
            ]),
            EditorRow([
                Label({text: "y", fixedWidth: 50}),
                TextBox({text: updatePointY, fixedWidth: 100})
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
        padding: Insets.from(3),
        visualStyle: {
            background:TRANSPARENT
        },
        children: [
            EditorRow([
                Label({text: "w", fixedWidth: 50}),
                TextBox({text: updateW, fixedWidth: 100}),
            ]),
            EditorRow([
                Label({text: "h", fixedWidth: 50}),
                TextBox({text: updateH, fixedWidth: 100}),
            ]),
        ]
    })
}

export function GetEditorForAtom(obj: ObjAtom<unknown>): GElement {
    switch (obj.getAtomType()) {
        case "string":
            return TextBox({
                text: AtomAsState(obj as ObjAtom<string>),
            })
        case "object": {
            switch (obj.typeName()) {
                case "Position":
                    return PointEditor(obj as ObjAtom<Point>)
                case "Size":
                    return SizeEditor(obj as ObjAtom<Size>)
            }
            break;
        }
        case "number": {
            let atom = obj as ObjAtom<number>
            return TextBox({
                text: {
                    get: () => atom.get() + "",
                    set: (v) => atom.set(parseInt(v))
                }
            })
        }
        case "boolean": {
            let atom = obj as ObjAtom<boolean>
            return CheckBox({
                selected: AtomAsState(atom),
                text: "on?",
            });
        }
        default:
            break;
    }
    return Label({text: "unknown type"})
}

function EditorRow(chs: GElement[]) {
    return HBox({
        borderWidth: Insets.from(0),
        visualStyle: {
            background: TRANSPARENT,
            borderColor: "red",
            textColor: "black",
        },
        mainAxisLayout: 'start',
        mainAxisSelfLayout: 'grow',
        children: chs
    })
}

function GetEditorForMap(obj1: ObjMap<unknown>) {
    return PropSheet(obj1)
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
            if (obj.objType() === 'map') {
                return EditorRow([
                    Label({text: prop, fixedWidth: 100}),
                    GetEditorForMap(obj as ObjMap<unknown>)
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
