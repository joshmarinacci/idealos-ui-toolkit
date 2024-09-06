import {FontSettings, MGlobals, MouseButton, RenderNodeSettings, SYMBOL_FONT_ENABLED} from "./base.ts";
import {Scene, SceneOpts} from "./scene.ts";
import {STATE_CACHE, StateCache} from "./state.ts";
import {setup_common_keybindings} from "./actions.ts";
import {calcCanvasFont, calcCanvasFont2, makeCanvas} from "./util.js";
import {Bounds, Point, Size} from "josh_js_util";
import {RenderContext, RenderingSurface} from "./gfx.js";
import {makeTabs} from "./demo.js";

// const state = {
//     toggle: false,
//     checked: true,
//     radioed: false,
//     selectedTab: 0,
//     selectedListItem1: 0,
//     selectedListItem2: 0,
//     scrollOffset1: new Point(0, 0),
//     scrollOffset2: new Point(0, 0),
//     textInputValue: "some long text",
//     textInputCursorPosition: new Point(5, 0)
// }

const size = new Size(1000, 600)

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

    fillText(settings: RenderNodeSettings, text: string, color: string): void {
        this.ctx.fillStyle = color
        this.ctx.font = calcCanvasFont2(settings)
        // console.log("text",n.settings.text, rc.ctx.font)
        // rc.ctx.textRendering = 'optimizeLegibility'
        // rc.ctx.textAlign = 'start'
        // rc.ctx.textBaseline = 'alphabetic'
        // console.log("font",rc.ctx.font)
        // console.log(`drawing metrics "${n.settings.text}" => ${rc.ctx.measureText(n.settings.text).width}`)
        let x = settings.contentOffset.x
        if(isNaN(settings.baseline)){
            console.log("missing baseline")
        }
        let y = settings.contentOffset.y + settings.baseline
        // console.log("text",n.settings.text, x,y,fnt)
        this.ctx.fillText(text,x,y)

    }

    measureText(fontSettings: FontSettings, text: string): [Size, number] {
        this.ctx.font = calcCanvasFont(fontSettings)
        let metrics = this.ctx.measureText(text)
        let size = new Size(
            Math.floor(metrics.width),
            Math.floor(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent))
        let baseline = metrics.fontBoundingBoxAscent
        if(!metrics.fontBoundingBoxAscent) {
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
    constructor(opts:SceneOpts) {
        super(opts);
    }
    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas
    }
    getCanvas() {
        return this.canvas
    }
    protected makeRc(): RenderContext {
        return {
            size: this.opts.size,
            scale: window.devicePixelRatio,
            surface: new CanvasRenderingSurface(this.canvas)
        }
    }
}

setup_common_keybindings()
const scene = new CanvasScene({})
scene.setComponentFunction(makeTabs)

MGlobals.set(Scene.name, scene)
MGlobals.set(SYMBOL_FONT_ENABLED, true)
MGlobals.set(STATE_CACHE, new StateCache())


function toMouseButton(e: MouseEvent):MouseButton {
    let button:MouseButton = 'None'
    if(e.buttons === 1) {
        button = 'Primary'
    }
    if(e.buttons === 2) {
        button = 'Secondary'
    }
    return button
}
loadFont().then(() => {
    return scene.init()
}).then(() => {
    const canvas = makeCanvas(size)
    scene.setDPI(window.devicePixelRatio)
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
        scene.handleMouseDown(pos,toMouseButton(e),e.shiftKey)
    })
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    })
    canvas.addEventListener('mouseup', (e) => {
        // @ts-ignore
        let rect = e.target.getBoundingClientRect()
        let pos = new Point(e.clientX, e.clientY);
        pos = pos.subtract(new Point(rect.x, rect.y))
        scene.handleMouseUp(pos,toMouseButton(e),e.shiftKey)
    })
    window.addEventListener('keydown', (e) => {
        scene.handleKeydownEvent(e.key, e.ctrlKey, e.shiftKey)
    })
    window.addEventListener('wheel', (e) => {
        // @ts-ignore
        let rect = e.target.getBoundingClientRect()
        let pos = new Point(e.clientX, e.clientY);
        pos = pos.subtract(new Point(rect.x, rect.y))
        scene.handleWheelEvent(pos,new Point(e.deltaX, e.deltaY))
    })
    scene.onShouldJustRedraw(() => scene.redraw())
    scene.setCanvas(canvas)
    scene.setSize(size)
    scene.layout()
    scene.redraw()
})





