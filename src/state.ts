
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

    useState<T>(key: string, fallback: () => T): [T, (val: T) => void] {
        let val: T
        if (!this.current_state) {
            this.warn(`missing state data for ${key}`)
        }
        if (this.current_state.has(key)) {
            val = this.current_state.get(key) as T
        } else {
            val = fallback()
            this.current_state.set(key, val)
        }
        const cs = this.current_state
        const setVal = (newVal: T): void => {
            cs.set(key, newVal)
        }
        return [val, setVal]
    }

    endLayout(key: string) {
        this.log("ending layout", key)
    }

    private log(...args: any[]) {
        // console.log("STATE", ...args)
    }

    private warn(...args: any[]) {
        console.warn("STATE", ...args)
    }
    public dump() {
        this.log("dump")
        for(let entry of this.element_map.entries()) {
            console.log(entry)
        }
    }
}
