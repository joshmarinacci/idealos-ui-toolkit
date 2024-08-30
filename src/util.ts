import {Bounds, Insets, Size} from "josh_js_util";
import {ElementSettings, FontSettings} from "./base.js";
import {withInsets} from "./gfx.js";

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
    return `${settings.fontWeight} ${settings.fontSize}px ${settings.font}`
}

export function getTotalInsets(settings: ElementSettings): Insets {
    let ins = withInsets(0)
    if (settings.margin) {
        ins = addInsets(ins, settings.margin)
    }
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
