import sdl from '@kmamal/sdl'
import Canvas from 'canvas'
import {setup_common_keybindings} from "./actions.js";
import {Scene} from "./scene.js";
import {MGlobals, SYMBOL_FONT_ENABLED} from "./base.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {Point, Size} from "josh_js_util";
import {makeTabs} from "./demo.js";
// @ts-ignore
import * as process from "node:process";
import {Style} from "./style.js";


const SIZE = new Size(1000,600)
Canvas.registerFont('MaterialIcons-Regular.ttf',{
    family:'material-icons'
})

const window = sdl.video.createWindow({ resizable: true, width:SIZE.w, height:SIZE.h })

function makeTree() {
    return makeTabs()
}

setup_common_keybindings()
const scene = new Scene(makeTree)
scene.setDPI(1)
MGlobals.set(Scene.name, scene)
MGlobals.set(SYMBOL_FONT_ENABLED, true)
MGlobals.set(STATE_CACHE, new StateCache())

const SDL_TO_CANVAS_MAP = new Map<string,string>
SDL_TO_CANVAS_MAP.set('left','ArrowLeft')
SDL_TO_CANVAS_MAP.set('right','ArrowRight')
SDL_TO_CANVAS_MAP.set('up','ArrowUp')
SDL_TO_CANVAS_MAP.set('down','ArrowDown')
SDL_TO_CANVAS_MAP.set('backspace','Backspace')
SDL_TO_CANVAS_MAP.set('return','Enter')

const redraw = (skipLayout:boolean) => {
    const { pixelWidth: width, pixelHeight: height } = window
    let dpi = window.pixelWidth / window.width
    // console.log(window,dpi)
    scene.setDPI(dpi)

    // console.log("redraw", skipLayout,width,height)
    if(!skipLayout) {
        scene.layout()
    }
    scene.redraw()
    // @ts-ignore
    const buffer = scene.getCanvas().toBuffer('raw')
    window.render(width, height, width * 4, 'bgra32', buffer)
}

scene.init().then(() => {
    window.on('expose', () => redraw(false))
    window.on('resize', ({ pixelWidth: width, pixelHeight: height }) => {
        scene.setCanvas(Canvas.createCanvas(width, height) as unknown as HTMLCanvasElement)
        scene.setSize(new Size(width, height))
        redraw(false)
    })
    window.on('mouseMove', (e)=>{
        scene.handleMouseMove(new Point(e.x,e.y))
    })
    window.on('mouseButtonDown', (e)=>{
        scene.handleMouseDown(new Point(e.x,e.y),false)
    })
    window.on('mouseButtonUp', (e)=>{
        scene.handleMouseUp(new Point(e.x,e.y))
    })
    window.on('mouseWheel', (e) => {
        scene.handleWheelEvent(new Point(e.x,e.y),new Point(e.dx,e.dy))
    })
    window.on('keyDown',e => {
        // console.log("keydown",e)
        if(e.key === 'q' && e.super) {
            console.log('quitting')
            process.exit(0)
        }
        if(e.key === 'f' && e.super && e.shift) {
            console.log("swapping the style")
            Style.toggle()
            redraw(false)
        }
        if(!e.key) return
        let key = e.key
        if(key === 'ctrl') {
            return
        }
        if(SDL_TO_CANVAS_MAP.has(key)) {
            key = SDL_TO_CANVAS_MAP.get(key)
        }
        scene.handleKeydownEvent(key, e.ctrl, e.shift)
    })
    scene.onShouldRedraw(() => redraw(false))
    scene.onShouldJustRedraw(() => redraw(true))

})




