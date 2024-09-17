import {Point} from "josh_js_util";

export const META_KEYS = ['Shift', 'Control', 'Alt', 'Meta']
type KeyStrokeDef = { key: string, control?: boolean, shift?:boolean, meta?:boolean, alt?:boolean }
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
export type KeyActionArgs = {
    text: string,
    pos: Point,
    selection: TextSelection
    key?: string,
}
type KeyAction = (args: KeyActionArgs) => { text: string, pos: Point, selection:TextSelection }

class ActionMap {
    actions: Map<string, any>;
    keystrokes: Map<any, any>;
    controls: Map<string, string>
    shifts: Map<string, string>
    alts: Map<string, string>
    metas: Map<string, string>

    constructor() {
        this.actions = new Map()
        this.keystrokes = new Map()
        this.controls = new Map()
        this.shifts = new Map()
        this.alts = new Map()
        this.metas = new Map()
    }

    addAction(name: string, cb: KeyAction) {
        this.actions.set(name, cb)
    }

    match(e: KeyStrokeDef): string | undefined {
        if (e.shift) return this.shifts.get(e.key)
        if (e.control) return this.controls.get(e.key)
        if (e.alt) return this.alts.get(e.key)
        if (e.meta) return this.metas.get(e.key)
        return this.keystrokes.get(e.key)
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
}

export const ACTION_MAP = new ActionMap()


export function setup_common_keybindings() {
    ACTION_MAP.registerKeystroke({key: 'f', control: true}, 'cursor-forward')
    ACTION_MAP.registerKeystroke({key: 'b', control: true}, 'cursor-backward')
    ACTION_MAP.registerKeystroke({key: 'p', control: true}, 'cursor-previous-line')
    ACTION_MAP.registerKeystroke({key: 'n', control: true}, 'cursor-next-line')
    ACTION_MAP.registerKeystroke({key: 'a', control: true, }, 'cursor-line-start')
    ACTION_MAP.registerKeystroke({key: 'e', control: true, }, 'cursor-line-end')

    ACTION_MAP.registerKeystroke({key: 'ArrowLeft'}, 'cursor-backward')
    ACTION_MAP.registerKeystroke({key: 'ArrowRight'}, 'cursor-forward')
    ACTION_MAP.registerKeystroke({key: 'ArrowLeft', shift:true}, 'selection-backward-char')
    ACTION_MAP.registerKeystroke({key: 'ArrowRight', shift:true}, 'selection-forward-char')

    ACTION_MAP.registerKeystroke({key: 'ArrowUp'}, 'cursor-previous-line')
    ACTION_MAP.registerKeystroke({key: 'ArrowDown'}, 'cursor-next-line')
    ACTION_MAP.registerKeystroke({key: 'Enter'}, 'insert-newline')
    ACTION_MAP.registerKeystroke({key: 'Backspace'}, 'delete-backward')
    ACTION_MAP.registerKeystroke({key: 'd', control: true}, 'delete-forward')
    ACTION_MAP.registerKeystroke({key: 'Delete'}, 'delete-forward')
    ACTION_MAP.registerKeystroke({key: 'End'}, 'cursor-line-end')
    ACTION_MAP.registerKeystroke({key: 'Home'}, 'cursor-line-start')

    ACTION_MAP.registerKeystroke({key: 'a', meta: true, }, 'select-all')
}
