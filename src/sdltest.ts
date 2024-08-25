import sdl from '@kmamal/sdl'
import Canvas from 'canvas'
import {setup_common_keybindings} from "./actions.js";
import {Scene} from "./scene.js";
import {MGlobals, SYMBOL_FONT_ENABLED} from "./base.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {Point, Size} from "josh_js_util";
import {makeTabs} from "./demo.js";

const window = sdl.video.createWindow({ resizable: true })

function makeTree() {
    return makeTabs()
}

setup_common_keybindings()
const scene = new Scene(makeTree)
scene.setDPI(2)
MGlobals.set(Scene.name, scene)
MGlobals.set(SYMBOL_FONT_ENABLED, false)
MGlobals.set(STATE_CACHE, new StateCache())


const redraw = () => {
    const { pixelWidth: width, pixelHeight: height } = window
    scene.layout()
    scene.redraw()
    const buffer = scene.getCanvas().toBuffer('raw')
    window.render(width, height, width * 4, 'bgra32', buffer)
}

scene.init().then(() => {
    window.on('expose', redraw)
    window.on('resize', ({ pixelWidth: width, pixelHeight: height }) => {
        scene.setCanvas(Canvas.createCanvas(width, height) as unknown as HTMLCanvasElement)
        scene.setSize(new Size(width, height))
        redraw()
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
    window.on('keyDown',e => {
        console.log("keydown",e)
    })
    scene.onShouldRedraw(() => redraw())

})




