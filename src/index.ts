import {MGlobals, MouseButton, SYMBOL_FONT_ENABLED} from "./base.ts";
import {Scene, SceneOpts} from "./scene.ts";
import {STATE_CACHE, StateCache} from "./state.ts";
import {setup_common_keybindings} from "./actions.ts";
import {calcCanvasFont3, makeCanvas} from "./util.js";
import {Bounds, Point, Size} from "josh_js_util";
import {RenderContext, RenderingSurface, TextOpts} from "./gfx.js";
import {DOM_KEYBOARD_CODE_TO_LOGICAL_CODE} from "./keyboard.js";
import {TextEditor} from "./apps/texteditor.js";

const size = new Size(400, 400)

async function loadFont() {
    // const font = new FontFace('material-icons',
    //     'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)')
    const font = new FontFace('material-icons',
        'url(material-symbols/material-symbols-outlined.woff2)');
    document.fonts.add(font)
    await font.load()
}


class CanvasRenderingSurface implements RenderingSurface {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
    }

    strokeBounds(bounds: Bounds, color: string, thickness: number): void {
        this.ctx.strokeStyle = color
        this.ctx.lineWidth = thickness
        this.ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h)
    }

    clipRect(bounds: Bounds): void {
        this.ctx.beginPath()
        this.ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h)
        this.ctx.clip()
    }

    fillText(text: string, pos: Point, opts?: TextOpts): void {
        this.ctx.save()
        this.ctx.fillStyle = 'black'
        this.ctx.textRendering = 'optimizeLegibility'
        if (opts) {
            this.ctx.fillStyle = opts.color || 'black'
            if (opts.fontSize && opts.fontFamily) {
                this.ctx.font = calcCanvasFont3(opts.fontSize, opts.fontFamily)
            }
            if (opts.valign === 'top') this.ctx.textBaseline = 'top'
            if (opts.valign === 'middle') this.ctx.textBaseline = 'middle'
            if (opts.valign === 'bottom') this.ctx.textBaseline = 'bottom'
            if (opts.halign === 'left') this.ctx.textAlign = 'left'
            if (opts.halign === 'center') this.ctx.textAlign = 'center'
            if (opts.halign === 'right') this.ctx.textAlign = 'right'
        }
        this.ctx.fillText(text, pos.x, pos.y)
        this.ctx.restore()
    }

    measureText(text: string, opts: TextOpts): [Size, number] {
        this.ctx.font = calcCanvasFont3(opts.fontSize || 12, opts.fontFamily ||
            'sans-serif')
        let metrics = this.ctx.measureText(text)
        let size = new Size(
            Math.floor(metrics.width),
            Math.floor(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent))
        let baseline = metrics.fontBoundingBoxAscent
        if (!metrics.fontBoundingBoxAscent) {
            size.h = Math.floor(metrics.emHeightAscent + metrics.emHeightDescent)
            baseline = metrics.emHeightAscent
        }
        return [size, baseline]
    }

    save(): void {
        this.ctx.save()
    }

    scale(s1: number, s2: number): void {
        this.ctx.scale(s1, s2)
    }

    translate(off: Point): void {
        this.ctx.translate(off.x, off.y)
    }

    restore(): void {
        this.ctx.restore()
    }

    fillRect(bounds: Bounds, color: string): void {
        this.ctx.fillStyle = color
        this.ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    }
}

class CanvasScene extends Scene {
    canvas!: HTMLCanvasElement;

    constructor(opts: SceneOpts) {
        super(opts);
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.markDirty()
    }

    protected makeRc(): RenderContext {
        return {
            size: this.opts.size,
            scale: window.devicePixelRatio,
            surface: new CanvasRenderingSurface(this.canvas)
        }
    }

    isDirty() {
        return this.dirty
    }
}

setup_common_keybindings()
const scene = new CanvasScene({
    size: size,
    debug_enabled: true,
})

scene.setComponentFunction(TextEditor)

MGlobals.set(Scene.name, scene)
MGlobals.set(SYMBOL_FONT_ENABLED, true)
MGlobals.set(STATE_CACHE, new StateCache())

function repaintLoop() {
    if (scene.isDirty()) {
        scene.layout()
        scene.redraw()
    }
    requestAnimationFrame(repaintLoop)
}

function toMouseButton(e: MouseEvent): MouseButton {
    let button: MouseButton = 'None'
    if (e.buttons === 1) {
        button = 'Primary'
    }
    if (e.buttons === 2) {
        button = 'Secondary'
    }
    return button
}

loadFont().then(() => {
    return scene.init()
}).then(() => {
    const canvas = makeCanvas(size)
    canvas.addEventListener('mousemove', (e) => {
        // @ts-ignore
        let rect = e.target.getBoundingClientRect()
        let pos = new Point(e.clientX, e.clientY);
        pos = pos.subtract(new Point(rect.x, rect.y))
        scene.handleMouseMove(pos, toMouseButton(e), e.shiftKey)
    })
    canvas.addEventListener('mousedown', (e) => {
        // @ts-ignore
        let rect = e.target.getBoundingClientRect()
        let pos = new Point(e.clientX, e.clientY);
        pos = pos.subtract(new Point(rect.x, rect.y))
        scene.handleMouseDown(pos, toMouseButton(e), e.shiftKey)
    })
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    })
    canvas.addEventListener('mouseup', (e) => {
        // @ts-ignore
        let rect = e.target.getBoundingClientRect()
        let pos = new Point(e.clientX, e.clientY);
        pos = pos.subtract(new Point(rect.x, rect.y))
        scene.handleMouseUp(pos, toMouseButton(e), e.shiftKey)
    })
    window.addEventListener('keydown', (e) => {
        const code = DOM_KEYBOARD_CODE_TO_LOGICAL_CODE[e.code]
        if (!code) console.warn(`no code for ${e.code}`)
        scene.handleKeydownEvent(code, e.ctrlKey, e.shiftKey, e.altKey, e.metaKey)
        // e.preventDefault()
    })
    window.addEventListener('wheel', (e) => {
        // @ts-ignore
        let rect = e.target.getBoundingClientRect()
        let pos = new Point(e.clientX, e.clientY);
        pos = pos.subtract(new Point(rect.x, rect.y))
        scene.handleWheelEvent(pos, new Point(e.deltaX, e.deltaY))
    })
    scene.setCanvas(canvas)
    scene.setSize(size)
    repaintLoop()

})





