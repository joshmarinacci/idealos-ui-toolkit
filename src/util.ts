import {Insets, Size} from "josh_js_util";

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
