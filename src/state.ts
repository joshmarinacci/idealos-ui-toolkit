
export const STATE_CACHE = 'STATE_CACHE';

class ElementStateCache {
    private current_state: Map<any, any>;
    constructor() {
        this.current_state = new Map()
    }
    useState<T>(key: string, fallback: () => T): [T, (val: T) => void] {
        let val: T
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


}

export class StateCache {
    private element_map: Map<string, ElementStateCache>;

    constructor() {
        this.element_map = new Map<string, ElementStateCache>
    }


    getState(key: string):ElementStateCache {
        if(!this.element_map.has(key)) {
            this.element_map.set(key,new ElementStateCache())
        }
        return this.element_map.get(key) as ElementStateCache
    }
}
