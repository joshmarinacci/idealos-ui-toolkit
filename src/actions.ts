import {Point} from "josh_js_util";

export const META_KEYS = ['Shift', 'Control', 'Alt', 'Meta']
type KeyStrokeDef = { key: string, control?: boolean }
export type KeyActionArgs = { text: string, pos: Point, key?: string }
type KeyAction = (args: KeyActionArgs) => { text: string, pos: Point }

class ActionMap {
    actions: Map<string, any>;
    keystrokes: Map<any, any>;
    controls: Map<string, string>

    constructor() {
        this.actions = new Map()
        this.keystrokes = new Map()
        this.controls = new Map()
    }

    addAction(name: string, cb: KeyAction) {
        this.actions.set(name, cb)
    }

    match(e: KeyStrokeDef): string | undefined {
        if (e.control) {
            return this.controls.get(e.key)
        }
        return this.keystrokes.get(e.key)
    }

    registerKeystroke(def: KeyStrokeDef, action: string) {
        if (def.control) {
            this.controls.set(def.key, action)
        } else {
            this.keystrokes.set(def.key, action)
        }
    }
}

export const ACTION_MAP = new ActionMap()


export function setup_common_keybindings() {
    ACTION_MAP.registerKeystroke({key:'f',control:true},'cursor-forward')
    ACTION_MAP.registerKeystroke({key:'b',control:true},'cursor-backward')
    ACTION_MAP.registerKeystroke({key:'p', control:true},'cursor-previous-line')
    ACTION_MAP.registerKeystroke({key:'n', control:true},'cursor-next-line')
    ACTION_MAP.registerKeystroke({key:'ArrowLeft'},'cursor-backward')
    ACTION_MAP.registerKeystroke({key:'ArrowRight'},'cursor-forward')
    ACTION_MAP.registerKeystroke({key:'ArrowUp'},'cursor-previous-line')
    ACTION_MAP.registerKeystroke({key:'ArrowDown'},'cursor-next-line')
    ACTION_MAP.registerKeystroke({key:'Enter'},'insert-newline')
    ACTION_MAP.registerKeystroke({key:'Backspace'},'delete-backward')
    ACTION_MAP.registerKeystroke({key:'d', control:true},'delete-forward')
}
