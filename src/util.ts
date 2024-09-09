import {Insets, Logger, make_logger, Point, Size} from "josh_js_util";
import {ElementSettings, MGlobals, StateHandler} from "./base.js";
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

export function calcCanvasFont3(fontSize:number, font:string) {
    return `${fontSize}px ${font}`
}

export function getTotalInsets(settings: ElementSettings): Insets {
    let ins = Insets.from(0)
    if (settings.borderWidth) {
        ins = ins.add(settings.borderWidth)
    }
    if (settings.padding) {
        ins = ins.add(settings.padding)
    }
    return ins
}

export function withFallback<T>(value: T | undefined, fallback: T): T {
    return value || fallback
}


export class DebugPoint extends Point {
    private log: Logger;
    private _x:number
    // @ts-ignore
    get x(): number {
        return this._x;
    }
    set x(value: number) {
        const stack = new Error().stack;
        if(this.log) this.log.info("set x",value,'\n',stack)
        this._x = value;
    }
    private _y:number
    // @ts-ignore
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
        // const stack = new Error().stack;
        // this.log.info("createed with",this._x,this._y,'\n',stack)
    }
    toString(): string {
        return `Pt(${this._x},${this._y})`
    }
    copy(): Point {
        // this.log.info(`copying( ${this._x}, ${this._y})`)
        return new Point(this._x, this._y)
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

