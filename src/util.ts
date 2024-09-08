import {Bounds, Insets, Logger, make_logger, Point, Size} from "josh_js_util";
import {ElementSettings, FontSettings, MGlobals, RenderNodeSettings, StateHandler} from "./base.js";
import {withInsets} from "./gfx.js";
import {Obj, ObjAtom} from "rtds-core";
import {Scene} from "./scene.js";

export function makeCanvas(size: Size) {
    const canvas = document.createElement('canvas')
    canvas.width = size.w*window.devicePixelRatio
    canvas.height = size.h*window.devicePixelRatio
    canvas.style.width = `${size.w}px`
    canvas.style.height = `${size.h}px`
    document.body.appendChild(canvas)
    return canvas
}

export function addInsets(a: Insets, b: Insets) {
    return new Insets(
        a.top + b.top,
        a.right + b.right,
        a.bottom + b.bottom,
        a.left + b.left
    )
}

export function insetsWidth(insets: Insets) {
    return insets.left + insets.right
}

export function insetsHeight(insets: Insets) {
    return insets.top + insets.bottom
}

export function calcCanvasFont(settings: FontSettings | undefined) {
    if (!settings) {
        return "16px sans-serif"
    }
    return `${settings.fontSize}px ${settings.font}`
}
export function calcCanvasFont2(settings:RenderNodeSettings|undefined) {
    if (!settings) {
        return "16px sans-serif"
    }
    return `${settings.fontSize}px ${settings.font}`
}
export function calcCanvasFont3(fontSize:number, font:string) {
    return `${fontSize}px ${font}`
}


export function getTotalInsets(settings: ElementSettings): Insets {
    let ins = withInsets(0)
    if (settings.borderWidth) {
        ins = addInsets(ins, settings.borderWidth)
    }
    if (settings.padding) {
        ins = addInsets(ins, settings.padding)
    }
    return ins
}

export function bdsSubInsets(bds: Bounds, insets?: Insets) {
    if(!insets) return bds.copy()
    return new Bounds(
        bds.x + insets.left,
        bds.y + insets.top,
        bds.w - insets.left - insets.right,
        bds.h - insets.top - insets.bottom,
    )
}

export function bdsAddInsets(bds: Bounds, insets: Insets) {
    return new Bounds(
        bds.x - insets.left,
        bds.y - insets.top,
        bds.w + insets.left + insets.right,
        bds.h + insets.top + insets.bottom,
    )
}

export function withFallback<T>(value: T | undefined, fallback: T): T {
    return value || fallback
}


export class DebugPoint extends Point {
    private log: Logger;
    private _x:number
    get x(): number {
        return this._x;
    }
    set x(value: number) {
        const stack = new Error().stack;
        if(this.log) this.log.info("set x",value,'\n',stack)
        this._x = value;
    }
    private _y:number
    get y(): number {
        return this._y;
    }
    set y(value: number) {
        const stack = new Error().stack;
        if(this.log) this.log.info("set y",value,'\n',stack)
        this._y = value;
    }
    constructor(x:number,y:number) {
        super(x,y);
        this._x = x
        this._y = y
        this.log = make_logger("DEBUG_POINT")
        const stack = new Error().stack;
        // this.log.info("createed with",this._x,this._y,'\n',stack)
    }
    toString(): string {
        return `Pt(${this._x},${this._y})`
    }
    copy(): Point {
        // this.log.info(`copying( ${this._x}, ${this._y})`)
        return new DebugPoint(this._x, this._y)
    }
}

export function useRefresh<T>(_key: string, data: Obj<T>) {
    const hand = () => {
        // console.log("the data has changed")
        const scene = MGlobals.get(Scene.name) as Scene
        scene.layout()
        scene.redraw()
        data.off('changed', hand)
    }
    data.on('changed', hand)
}

export function AtomAsState<T>(atom: ObjAtom<T>): StateHandler<T> {
    return {
        get: () => atom.get(),
        set: (v) => {
            atom.set(v)
        }
    }
}

export function expandSize(size: Size, point: Point) {
    return new Size(
        size.w + point.x,
        size.h + point.y
    )
}
