import {ObjAtom, ObjMap} from "rtds-core";
import {Insets, Point, Size} from "josh_js_util";
import {HBox, VBox} from "./layout.js";
import {Label} from "./text.js";
import {TextBox} from "./textinput.js";
import {GElement} from "./base.js";
import {AtomAsState} from "./util.js";

export function PointEditor(atom: ObjAtom<Point>) {
    return VBox({
        fixedHeight: 100,
        children: [
            HBox({
                fixedWidth: 200,
                children: [
                    Label({text: "x"}),
                    TextBox({
                        multiline: false,
                        text: {
                            get: (): string => {
                                return atom.get().x + ""
                            },
                            set: (v: string): void => {
                                let pt = atom.get()
                                pt = new Point(parseInt(v), pt.y)
                                atom.set(pt)
                            }
                        }
                    })
                ]
            }),
            HBox({
                fixedWidth: 200,
                children: [
                    Label({text: "y"}),
                    TextBox({
                        multiline: false,
                        text: {
                            get: (): string => {
                                return atom.get().y + ""
                            },
                            set: (v: string): void => {
                                let pt = atom.get()
                                pt = new Point(pt.x, parseInt(v))
                                atom.set(pt)
                            }
                        }
                    }),
                ]
            })
        ]
    })
}

export function SizeEditor(atom: ObjAtom<Size>) {
    return VBox({
        fixedHeight: 100,
        children: [
            HBox({
                fixedWidth: 200,
                children: [
                    Label({text: "x"}),
                    TextBox({
                        multiline: false,
                        text: {
                            get: (): string => {
                                return atom.get().w + ""
                            },
                            set: (v: string): void => {
                                let pt = atom.get()
                                pt = new Size(parseInt(v), pt.h)
                                atom.set(pt)
                            }
                        }
                    }),
                ]
            }),
            HBox({
                fixedWidth: 200,
                children: [
                    Label({text: "y"}),
                    TextBox({
                        multiline: false,
                        text: {
                            get: (): string => {
                                return atom.get().h + ""
                            },
                            set: (v: string): void => {
                                let pt = atom.get()
                                pt = new Size(pt.w, parseInt(v))
                                atom.set(pt)
                            }
                        }
                    }),
                ]
            })
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

export function PropSheet(rect: ObjMap<unknown> | undefined) {
    let children: GElement[] = []
    if (rect) {
        children = rect.getPropNames().map(prop => {
            let obj = rect.get(prop) as ObjAtom<any>
            if (obj.objType() === 'atom') {
                return HBox({
                    fixedWidth: 150,
                    mainAxisSelfLayout: 'grow',
                    crossAxisLayout: 'center',
                    children: [
                        Label({text: prop}),
                        GetEditorForAtom(obj as ObjAtom<unknown>)
                    ]
                })
            }
            return Label({text: 'unsupported property'})
        })
    }
    return VBox({
        fixedWidth: 300,
        borderWidth: Insets.from(1),
        padding: Insets.from(3),
        // fixedHeight: 200,
        visualStyle: {
            background: '#f0f0f0',
            borderColor: 'black',
        },
        children: children,
    })
}
