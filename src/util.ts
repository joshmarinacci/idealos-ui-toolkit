import {Size} from "josh_js_util";

export function makeCanvas(size: Size) {
    const canvas = document.createElement('canvas')
    canvas.width = size.w*window.devicePixelRatio
    canvas.height = size.h*window.devicePixelRatio
    canvas.style.width = `${size.w}px`
    canvas.style.height = `${size.h}px`
    document.body.appendChild(canvas)
    return canvas
}
