import {Point} from "josh_js_util";

export const STATE_CACHE = 'STATE_CACHE';

export class StateCache {
    private current_state: Map<any, any> | undefined;
    private element_map: Map<any, any>;

    constructor() {
        this.log("creating state cache")
        this.element_map = new Map<string, unknown>
    }

    startElement(key: string) {
        this.log("starting element", key)
        if (!this.element_map.has(key)) {
            this.element_map.set(key, new Map<string, unknown>)
        }
        this.current_state = this.element_map.get(key)
    }

    endElement(key: string) {
        this.current_state = undefined
        this.log("ending element", key)
    }

    startLayout(key: string) {
        this.log("starting layout")
        if (!this.element_map.has(key)) {
            this.warn(`missing data for ${key}`)
        }
        this.current_state = this.element_map.get(key)
    }

    useState(key: string, fallback: () => Point): [Point, (val: Point) => void] {
        let val: Point
        if (!this.current_state) {
            this.warn(`missing state data for ${key}`)
        }
        if (this.current_state.has(key)) {
            val = this.current_state.get(key) as Point
        } else {
            val = fallback()
            this.current_state.set(key, val)
        }
        const setVal = (newVal: Point): void => {
            this.current_state.set(key, newVal)
        }
        return [val, setVal]
    }

    endLayout(key: string) {
        this.log("ending layout", key)
    }

    private log(...args: any[]) {
        console.log("STATE", ...args)
    }

    private warn(...args: any[]) {
        console.warn("STATE", ...args)
    }
}
