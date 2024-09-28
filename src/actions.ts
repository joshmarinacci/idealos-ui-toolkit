import {Point} from "josh_js_util";
import {LOGICAL_KEYBOARD_CODE, LogicalKeyboardCode} from "./keyboard.js";
import {MKeyboardEvent} from "./base.js";

export const META_KEYS = ['Shift', 'Control', 'Alt', 'Meta', 'CONTROL_RIGHT','CONTROL_LEFT','SHIFT_LEFT','SHIFT_RIGHT',
    LOGICAL_KEYBOARD_CODE.META_LEFT, LOGICAL_KEYBOARD_CODE.META_RIGHT
]
type KeyStrokeDef = { key: LogicalKeyboardCode, control?: boolean, shift?:boolean, meta?:boolean, alt?:boolean }
export class TextSelection {
    start: Point;
    end: Point;
    private active: boolean;
    constructor(start:Point,end:Point,active:boolean) {
        this.start = start
        if(this.start.x < 0) {
            this.start.x = 0
        }
        this.end = end
        this.active = active
    }

    static makeWith(start: Point, end: Point):TextSelection {
        return new TextSelection(start,end,true)
    }

    isActive() {
        return this.active
    }

    static makeInactive() {
        return new TextSelection(new Point(0,0), new Point(0,0),false)
    }

    extendRight(count: number) {
        return new TextSelection(this.start,this.end.add(new Point(count,0)),this.active)
    }
    extendLeft(count: number) {
        return new TextSelection(this.start.subtract(new Point(count,0)),this.end,this.active)
    }

    getEnd() {
        return this.end
    }

    makeAt(pos: Point) {
        return new TextSelection( pos,pos.add(new Point(1,0)),true)
    }

    clear() {
        return TextSelection.makeInactive()
    }

    getStart() {
        return this.start
    }

}
export type KeyboardModifiers = {
    shift:boolean
    control:boolean,
    alt:boolean,
    meta:boolean,
}
export type KeyActionArgs = {
    text: string,
    pos: Point,
    selection: TextSelection
    key: LogicalKeyboardCode,
    mods:KeyboardModifiers,
    delegate?:KeyAction
}
export type KeyActionResults = { text:string, pos:Point, selection:TextSelection }
export type KeyAction = (args: KeyActionArgs) => KeyActionResults

export class ActionMap {
    private actions: Map<string, KeyAction>;
    keystrokes: Map<any, any>;
    controls: Map<string, string>
    shifts: Map<string, string>
    alts: Map<string, string>
    metas: Map<string, string>
    private parent: ActionMap | undefined;

    constructor(parent?:ActionMap) {
        this.parent = parent
        this.actions = new Map()
        this.keystrokes = new Map()
        this.controls = new Map()
        this.shifts = new Map()
        this.alts = new Map()
        this.metas = new Map()
    }

    addAction(name: string, action: KeyAction) {
        this.actions.set(name, action)
    }

    match(e: KeyStrokeDef): string | undefined {
        if (e.shift) return this.shifts.get(e.key)
        if (e.control) return this.controls.get(e.key)
        if (e.alt) return this.alts.get(e.key)
        if (e.meta) return this.metas.get(e.key)
        let kk = this.keystrokes.get(e.key)
        if(kk) return kk
        if(this.parent) return this.parent.match(e)
        return undefined
    }

    registerKeystroke(def: KeyStrokeDef, action: string) {
        if(def.shift) {
            this.shifts.set(def.key, action)
            return
        }
        if(def.meta) {
            this.metas.set(def.key, action)
            return
        }
        if(def.alt) {
            this.alts.set(def.key, action)
            return
        }
        if (def.control) {
            this.controls.set(def.key, action)
            return
        }
        this.keystrokes.set(def.key, action)
    }

    size() {
        return this.actions.size
    }

    getAction(action_name: string):KeyAction | undefined {
        if(this.actions.has(action_name)) return this.actions.get(action_name)
        if(this.parent) return this.parent.getAction(action_name)
        return undefined
    }

    doAction(name: string, text: string, pos: Point, kbe: MKeyboardEvent, selection: TextSelection, mods: KeyboardModifiers):KeyActionResults {
        if(this.actions.has(name)) {
            let act = this.actions.get(name) as KeyAction
            let parent = this.parent?.getAction(name)
            return act({text:text,pos:pos,selection:selection, mods:mods,key:kbe.key, delegate:parent})
        } else {
            throw new Error("insert-character action not found")
        }
    }
}

export const ACTION_MAP = new ActionMap()



export function setup_common_keybindings() {
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.KEY_F, control: true}, 'cursor-forward')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.KEY_B, control: true}, 'cursor-backward')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.KEY_P, control: true}, 'cursor-previous-line')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.KEY_N, control: true}, 'cursor-next-line')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.KEY_A, control: true, }, 'cursor-line-start')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.KEY_E, control: true, }, 'cursor-line-end')

    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.ARROW_LEFT}, 'cursor-backward')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.ARROW_RIGHT}, 'cursor-forward')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.ARROW_LEFT, shift:true}, 'selection-backward-char')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.ARROW_RIGHT, shift:true}, 'selection-forward-char')

    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.ARROW_UP}, 'cursor-previous-line')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.ARROW_DOWN}, 'cursor-next-line')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.ENTER}, 'insert-newline')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.BACKSPACE}, 'delete-backward')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.KEY_D, control: true}, 'delete-forward')
    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.DELETE}, 'delete-forward')
    ACTION_MAP.registerKeystroke({key: 'End'}, 'cursor-line-end')
    ACTION_MAP.registerKeystroke({key: 'Home'}, 'cursor-line-start')

    ACTION_MAP.registerKeystroke({key: LOGICAL_KEYBOARD_CODE.KEY_A, meta: true, }, 'select-all')
}
