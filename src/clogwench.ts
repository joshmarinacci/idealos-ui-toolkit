import pureimage, {Bitmap, Context} from "pureimage"
import * as zmq from "zeromq"
import {Scene, SceneOpts} from "./scene.js";
import {MGlobals, SYMBOL_FONT_ENABLED} from "./base.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {Bounds, Point, Size} from "josh_js_util";
import {RenderContext, RenderingSurface, TextOpts} from "./gfx.js";
import {calcCanvasFont3} from "./util.js";
import {EventType, Socket} from "zeromq";
import {LayoutTest, makeBaselineRow, makeCompsDemo, makeTabs} from "./demo.js";
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
    constructor(size: Size) {
        this.size = size
        this.bitmap = pureimage.make(size.w, size.h)
        this.ctx = this.bitmap.getContext('2d')
    }
    resize(size: Size) {
        this.size = size
        this.bitmap = pureimage.make(size.w, size.h)
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
        this.ctx.fillStyle = color
        this.ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
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
            Math.floor(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent))
        let baseline = metrics.fontBoundingBoxAscent
        if(!metrics.fontBoundingBoxAscent) {
            size.h = Math.floor(metrics.emHeightAscent + metrics.emHeightDescent)
            baseline = metrics.emHeightAscent
        }
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
    MGlobals.set(Scene.name, scene)
    MGlobals.set(SYMBOL_FONT_ENABLED, false)
    MGlobals.set(STATE_CACHE, new StateCache())

    scene.setComponentFunction(makeCompsDemo)
    scene.layout()
    scene.redraw()

    if(sock.writable) {
        await sock.send(['open-window', JSON.stringify(size.toJSON()) ])
    }

    async function updateAndRepaint() {
        if (sock.writable) {
            const bitmap = scene.surface.bitmap
            const size = new Size(bitmap.width,bitmap.height)
            // console.log("sending bitmap of size",size)
            await sock.send(['repaint', JSON.stringify(size.toJSON()), bitmap.data])
        }
    }

    await updateAndRepaint()
    for await (const frames of sock) {
        // console.log("app received msg", frames)
        // console.log("first frame",frames[0].toString("utf-8"))
        if (frames[0].toString() === 'clicked') {
            let pt = Point.fromJSON(JSON.parse(frames[1].toString("utf-8")))
            // console.log("we were clicked at ", JSON.parse(frames[1].toString("utf-8")))
            scene.handleMouseDown(pt,"Primary", false)
            await updateAndRepaint()
        }
        if(frames[0].toString() === 'key-down') {
            let keycode = JSON.parse(frames[1].toString("utf-8"))
            // console.log("keycode is",keycode)
            let mods = JSON.parse(frames[2].toString("utf-8"))
            // console.log("mods is",mods)
            const ikc:LogicalKeyboardCode = IDEALOS_KEYBOARD_CODE[keycode as string]
            // console.log("ikc", ikc)
            scene.handleKeydownEvent(ikc,false,false,false,false)
            await updateAndRepaint()
        }
        if(frames[0].toString() === 'window-resized') {
            let size = Size.fromJSON(JSON.parse(frames[1].toString("utf-8")))
            console.log("resized to",size)
            scene.resize(size)
            scene.layout()
            scene.redraw()
            await updateAndRepaint()
        }
    }
}

doit().then(() => console.log("fully started")).catch((e) => console.error(e))
