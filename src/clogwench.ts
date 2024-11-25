import pureimage, {Bitmap, Context} from "pureimage"
import * as zmq from "zeromq"
import {Scene, SceneOpts} from "./scene.js";
import {MGlobals, MouseButton, SYMBOL_FONT_ENABLED, TRANSPARENT} from "./base.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {Bounds, Point, Size} from "josh_js_util";
import {RenderContext, RenderingSurface, TextOpts} from "./gfx.js";
import {calcCanvasFont3} from "./util.js";
import {EventType, Socket} from "zeromq";
import {makeTabs} from "./apps/demo.js";
import {IDEALOS_KEYBOARD_CODE, LogicalKeyboardCode} from "./keyboard.js";
import {setup_common_keybindings} from "./actions.js";


export type Color = [r:number, g:number, b:number];
export const COLORS:Record<string, Color> = {
    RED:[255,0,0],
    GREEN:[0,255,0],
    BLUE:[0,0,255]
}

type Callback = (any: any) => any

class PureImageSurface implements RenderingSurface {
    private size: Size;
    bitmap: Bitmap;
    private ctx: Context;
    private data: ArrayBuffer;
    private use_fast_fill_rect: boolean;
    constructor(size: Size) {
        this.size = size
        this.use_fast_fill_rect = true
        this.bitmap = pureimage.make(size.w, size.h)
        this.data = new ArrayBuffer(size.w*size.h*4)
        // @ts-ignore
        this.bitmap.data = new Uint8ClampedArray(this.data)
        this.ctx = this.bitmap.getContext('2d')
    }
    resize(size: Size) {
        this.size = size
        this.bitmap = pureimage.make(size.w, size.h)
        this.data = new ArrayBuffer(size.w*size.h*4)
        // @ts-ignore
        this.bitmap.data = new Uint8ClampedArray(this.data)
        this.ctx = this.bitmap.getContext('2d')
        console.log("resized context",size)
    }

    save(): void {
        this.ctx.save()
    }
    scale(s1: number, s2: number): void {
        this.ctx.scale(s1,s2)
    }
    translate(off: Point): void {
        this.ctx.translate(off.x, off.y)
    }
    restore(): void {
        this.ctx.restore()
    }
    fillRect(bounds: Bounds, color: string): void {
        if(color === TRANSPARENT) return
        this.ctx.fillStyle = color
        if(this.use_fast_fill_rect
            && this.ctx._transform.isIdentity()
        ) {
            // @ts-ignore
            const ncolor = this.ctx._fillColor
            // flip the endianness of the color
            let cv = new ArrayBuffer(4)
            let dv = new DataView(cv)
            dv.setUint32(0, ncolor)
            let ncolor2 = dv.getUint32(0, true)
            let arr32 = new Uint32Array(this.data)
            //alpha, blue, green, red
            for (let j = bounds.top(); j < bounds.bottom(); j++) {
                let start = j * this.size.w + bounds.x
                let end = start + bounds.w
                arr32.fill(ncolor2, start, end)
            }
        } else {
            this.ctx.fillRect(bounds.x, bounds.y, bounds.w,bounds.h)
        }
    }
    measureText(text: string, opts: TextOpts): [Size, number] {
        // console.log("measuring text opts",text,opts)
        let font = calcCanvasFont3(opts.fontSize || 12, opts.fontFamily ||
            'sans-serif')
        // console.log("foont is",font)
        this.ctx.font = font
        let metrics = this.ctx.measureText(text)
        let size = new Size(
            Math.floor(metrics.width),
            Math.floor(metrics.emHeightAscent + metrics.emHeightDescent))
        let baseline = metrics.emHeightAscent
        return [size, baseline]
    }
    fillText(text: string, pos:Point, opts?:TextOpts): void {
        this.ctx.save()
        this.ctx.fillStyle = 'black'
        // this.ctx.textRendering = 'optimizeLegibility'
        if(opts) {
            this.ctx.fillStyle = opts.color || 'black'
            if(opts.fontSize && opts.fontFamily) {
                this.ctx.font = calcCanvasFont3(opts.fontSize, opts.fontFamily)
            }
            if(opts.valign === 'top') this.ctx.textBaseline = 'top'
            if(opts.valign === 'middle') this.ctx.textBaseline = 'middle'
            if(opts.valign === 'bottom') this.ctx.textBaseline = 'bottom'
            if(opts.halign === 'left') this.ctx.textAlign = 'left'
            if(opts.halign === 'center') this.ctx.textAlign = 'center'
            if(opts.halign === 'right') this.ctx.textAlign = 'right'
        }
        this.ctx.fillText(text,pos.x,pos.y)
        this.ctx.restore()
    }
    clipRect(bounds: Bounds): void {
        this.ctx.beginPath()
        this.ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h)
        this.ctx.clip()
    }
    strokeBounds(bounds: Bounds, color: string, thickness: number): void {
        this.ctx.beginPath()
        this.ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h)
        this.ctx.strokeStyle = color
        // this.ctx.lineWidth = thickness
        this.ctx.stroke()
    }

}

class ClogwenchScene extends Scene {
    surface: PureImageSurface;
    constructor(opts:SceneOpts) {
        super(opts);
        this.surface = new PureImageSurface(opts.size)
    }
    protected makeRc(): RenderContext {
        return {
            size: this.opts.size,
            scale:1,
            surface: this.surface
        }
    }

    resize(size: Size) {
        this.opts.size = size
        this.surface.resize(size)
        this.dirty = true
    }
}

// export class SimpleImage {
//     private data:Uint8ClampedArray;
//     private size: Size;
//     constructor(size: Size, data?:Uint8ClampedArray) {
//         this.size = size
//         if(data) {
//             this.data = data
//         } else {
//             this.data = new Uint8ClampedArray(this.size.w * this.size.h * 4)
//         }
//     }
//
//
//     public asBuffer():ArrayBuffer {
//         return this.data
//     }
//
//     public fill(RED: Color):void {
//         this.forEach(()=>{
//             return RED
//         })
//     }
//
//     public forEach(param: (val:Color, index:Point) => Color) {
//         for(let j=0;j<this.size.h; j++) {
//             for(let i=0;i<this.size.w;i++) {
//                 let pt = new Point(i,j)
//                 let val = this.getAt(pt)
//                 let v2 = param(val,pt);
//                 this.setAt(pt,v2)
//             }
//         }
//     }
//
//     public getAt(pt: Point):Color {
//         let n = (pt.y * this.size.w + pt.x)*4
//         let val = [this.data[n],this.data[n+1], this.data[n+2]]
//         return val as Color
//     }
//     public setAt(pt: Point, value:Color):void {
//         let n = (pt.y * this.size.w + pt.x)*4
//         this.data[n]   = value[0]
//         this.data[n+1] = value[1]
//         this.data[n+2] = value[2]
//         this.data[n+3] = 255
//     }
//
//     getSize() {
//         return this.size
//     }
//
//     asUint8ClampedArray():Uint8ClampedArray {
//         return this.data
//     }
// }

export function monitor(receiver: Socket) {
    const types:EventType[] = [
        "accept","accept:error",
        "bind","bind:error",
        "connect", "connect:delay", "connect:retry",
        "disconnect",  "end", "unknown"
    ]
    types.forEach(t => receiver.events.on(t, () => console.log(t)));
}

async function doit() {
    let font = pureimage.registerFont(
        "./fonts/SourceSansPro-Regular.ttf",
        "sans-serif"
    )
    await font.load()

    let symbol_font = pureimage.registerFont(
        "./MaterialIcons-Regular.ttf",
        "material-icons"
    )
    await symbol_font.load()

    const sock = new zmq.Dealer({})
    sock.connect("tcp://127.0.0.1:3000")
    monitor(sock)
    // await sock.bind("tcp://127.0.0.1:3000")
    console.log("app connected")
    sock.events.on('disconnect', () => {
        console.log("disconnected")
        process.exit(0)
    })

    // const image = new SimpleImage(new Size(800, 600))
    // image.fill(COLORS.RED)

    const size = new Size(800,600)
    setup_common_keybindings()
    const scene = new ClogwenchScene({
        size: size,
        debug_enabled:true,
    })
    scene.log.setEnabled(true)
    MGlobals.set(Scene.name, scene)
    MGlobals.set(SYMBOL_FONT_ENABLED, true)
    MGlobals.set(STATE_CACHE, new StateCache())

    scene.setComponentFunction(makeTabs)

    if(sock.writable) {
        await sock.send(['open-window', JSON.stringify(size.toJSON()) ])
    }

    async function sendRepaint() {
        if (sock.writable) {
            const bitmap = scene.surface.bitmap
            const size = new Size(bitmap.width,bitmap.height)
            // console.log("sending bitmap of size",size)
            await sock.send(['repaint', JSON.stringify(size.toJSON()), bitmap.data])
        }
    }
    async function repaintIfDirty() {
        if(scene.dirty) {
            console.log('is dirty, redrawing', Date.now())
            scene.layout()
            scene.redraw()
            await sendRepaint()
        }
    }
    await repaintIfDirty()
    for await (const frames of sock) {
        // console.log("app received msg", frames)
        // console.log("first frame",frames[0].toString("utf-8"))
        if (frames[0].toString() === 'mouse-down') {
            let pt = Point.fromJSON(JSON.parse(frames[1].toString("utf-8")))
            const button = frames[2].toString("utf-8") as MouseButton
            scene.handleMouseDown(pt,button, false)
        }
        if (frames[0].toString() === 'mouse-up') {
            let pt = Point.fromJSON(JSON.parse(frames[1].toString("utf-8")))
            const button = frames[2].toString("utf-8") as MouseButton
            scene.handleMouseUp(pt,button, false)
        }
        if (frames[0].toString() === 'mouse-move') {
            let pt = Point.fromJSON(JSON.parse(frames[1].toString("utf-8")))
            scene.handleMouseMove(pt,"Primary", false)
        }
        if(frames[0].toString() === 'key-down') {
            let keycode = JSON.parse(frames[1].toString("utf-8"))
            // console.log("keycode is",keycode)
            let mods = JSON.parse(frames[2].toString("utf-8"))
            // console.log("mods is",mods)
            const ikc:LogicalKeyboardCode = IDEALOS_KEYBOARD_CODE[keycode as string]
            // console.log("ikc", ikc)
            scene.handleKeydownEvent(ikc,mods.ctrl,mods.shift,mods.alt,mods.meta)
        }
        if(frames[0].toString() === 'window-resized') {
            let size = Size.fromJSON(JSON.parse(frames[1].toString("utf-8")))
            scene.resize(size)
        }
        await repaintIfDirty()
    }
}

doit().then(() => console.log("fully started")).catch((e) => console.error(e))
