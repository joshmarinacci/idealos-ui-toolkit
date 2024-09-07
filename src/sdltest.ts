import sdl from '@kmamal/sdl'
import Canvas, {Canvas as SDLCanvas, CanvasRenderingContext2D, TextMetrics} from 'canvas'
import {setup_common_keybindings} from "./actions.js";
import {Scene, SceneOpts} from "./scene.js";
import {MGlobals, SYMBOL_FONT_ENABLED} from "./base.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {Bounds, Point, Size} from "josh_js_util";
import {makeTabs} from "./demo.js";
// @ts-ignore
import * as process from "node:process";
import {Style} from "./style.js";
import {RenderContext, RenderingSurface, TextOpts} from "./gfx.js";
import {calcCanvasFont3} from "./util.js";

const SDL_TO_CANVAS_MAP = new Map<string,string>
SDL_TO_CANVAS_MAP.set('left','ArrowLeft')
SDL_TO_CANVAS_MAP.set('right','ArrowRight')
SDL_TO_CANVAS_MAP.set('up','ArrowUp')
SDL_TO_CANVAS_MAP.set('down','ArrowDown')
SDL_TO_CANVAS_MAP.set('backspace','Backspace')
SDL_TO_CANVAS_MAP.set('return','Enter')
Canvas.registerFont('MaterialIcons-Regular.ttf', {
    family: 'material-icons'
})

class SDLRenderingSurface implements RenderingSurface {
    private canvas: SDLCanvas
    private ctx: CanvasRenderingContext2D;
    constructor(canvas:SDLCanvas) {
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d");
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
    measureText(text: string, opts: TextOpts): [Size, number] {
        this.ctx.font = calcCanvasFont3(opts.fontSize || 12, opts.fontFamily ||
            'sans-serif')
        let metrics:TextMetrics = this.ctx.measureText(text)
        console.log("metrics",metrics)
        let size = new Size(
            Math.floor(metrics.width),
            Math.floor(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent))
        let baseline = metrics.fontBoundingBoxAscent
        if(!metrics.fontBoundingBoxAscent) {
            // @ts-ignore
            size.h = Math.floor(metrics.emHeightAscent + metrics.emHeightDescent)
            // @ts-ignore
            baseline = metrics.emHeightAscent
        }
        return [size, baseline]
    }
    fillText(text: string, pos:Point, opts?:TextOpts): void {
        this.ctx.save()
        this.ctx.fillStyle = 'black'
        // @ts-ignore
        this.ctx.textRendering = 'optimizeLegibility'
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
        this.ctx.rect(bounds.x,bounds.y,bounds.w,bounds.h)
        this.ctx.clip()
    }
    strokeBounds(bounds: Bounds, color: string, thickness: number): void {
        this.ctx.strokeStyle= color
        this.ctx.lineWidth = thickness
        this.ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h)
    }
}

class SDLScene extends Scene {
    private window: sdl.Sdl.Video.Window;
    private canvas: SDLCanvas;
    constructor(opts:SceneOpts) {
        super(opts);
        this.canvas = Canvas.createCanvas(this.opts.size.w,this.opts.size.h);
        this.window = sdl.video.createWindow({ resizable: true, width:opts.size.w, height:opts.size.h })
        this.window.on('expose', () => this.sdlRedraw(false))
        this.window.on('resize', ({ pixelWidth: width, pixelHeight: height }) => {
            this.canvas = Canvas.createCanvas(width, height)
            this.setSize(new Size(width, height))
            this.sdlRedraw(false)
        })
        this.window.on('mouseMove', (e)=>{
            this.handleMouseMove(new Point(e.x,e.y),"Primary",false)
        })
        this.window.on('mouseWheel', (e) => {
            this.handleWheelEvent(new Point(e.x,e.y),new Point(e.dx,e.dy))
        })
        this.window.on('mouseButtonDown', (e)=>{
            this.handleMouseDown(new Point(e.x,e.y),"Primary",false)
        })
        this.window.on('mouseButtonUp', (e)=>{
            this.handleMouseUp(new Point(e.x,e.y),"Primary",false)
        })
        this.onShouldRedraw(() => this.sdlRedraw(false))
        this.onShouldJustRedraw(() => this.sdlRedraw(true))
        this.window.on('keyDown',(e) => {
            // console.log("keydown",e)
            if(e.key === 'q' && e.super) {
                console.log('quitting')
                process.exit(0)
            }
            if(e.key === 'f' && e.super && e.shift) {
                console.log("swapping the style")
                Style.toggle()
                this.sdlRedraw(false)
            }
            if(!e.key) return
            let key = e.key
            if(key === 'ctrl') {
                return
            }
            if(SDL_TO_CANVAS_MAP.has(key)) {
                key = SDL_TO_CANVAS_MAP.get(key) as string
            }
            // for some reason the types of ctrl and shift are number, but really booleans
            scene.handleKeydownEvent(key, e.ctrl as unknown as boolean, e.shift as unknown as boolean)
        })
    }

    protected makeRc(): RenderContext {
        return {
            size:this.opts.size,
            scale: 2,
            surface: new SDLRenderingSurface(this.canvas)
        }
    }

    sdlRedraw(skipLayout:boolean) {
        // const { pixelWidth: width, pixelHeight: height } = window
        // let dpi = this.window.pixelWidth / this.window.width
        // console.log(window,dpi)
        // scene.setDPI(dpi)

        // console.log("redraw", skipLayout,width,height)
        if(!skipLayout) {
            scene.layout()
        }
        this.redraw()
        // @ts-ignore
        const buffer = this.canvas.toBuffer('raw')
        this.window.render(this.window.pixelWidth, this.window.pixelHeight, this.window.pixelWidth * 4, 'bgra32', buffer)
    }
}

setup_common_keybindings()
const scene = new SDLScene({size:new Size(1200,600)})
scene.setComponentFunction(makeTabs)
MGlobals.set(Scene.name, scene)
MGlobals.set(SYMBOL_FONT_ENABLED, true)
MGlobals.set(STATE_CACHE, new StateCache())


