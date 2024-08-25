import {MGlobals, SYMBOL_FONT_ENABLED} from "./base.ts";
import {Scene} from "./scene.ts";
import {STATE_CACHE, StateCache} from "./state.ts";
import {setup_common_keybindings} from "./actions.ts";
import {makeTabs} from "./demo.ts";
import {makeCanvas} from "./util.js";
import {Point, Size} from "josh_js_util";

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


setup_common_keybindings()
const scene = new Scene(makeTabs)
MGlobals.set(Scene.name, scene)
MGlobals.set(SYMBOL_FONT_ENABLED, false)
MGlobals.set(STATE_CACHE, new StateCache())
scene.init().then(() => {
    const size =new Size(800,600)
    const canvas = makeCanvas(size)
    scene.setDPI(window.devicePixelRatio)
    canvas.addEventListener('mousemove', (e) => {
        // @ts-ignore
        let rect = e.target.getBoundingClientRect()
        let pos = new Point(e.clientX, e.clientY);
        pos = pos.subtract(new Point(rect.x, rect.y))
        scene.handleMouseMove(pos)
    })

    canvas.addEventListener('mousedown', (e) => {
        // @ts-ignore
        let rect = e.target.getBoundingClientRect()
        let pos = new Point(e.clientX, e.clientY);
        pos = pos.subtract(new Point(rect.x, rect.y))
        scene.handleMouseDown(pos,e.shiftKey)
    })
    canvas.addEventListener('mouseup', (e) => {
        // @ts-ignore
        let rect = e.target.getBoundingClientRect()
        let pos = new Point(e.clientX, e.clientY);
        pos = pos.subtract(new Point(rect.x, rect.y))
        scene.handleMouseUp(pos)
    })
    window.addEventListener('keydown', (e) => {
        scene.handleKeydownEvent(e)
    })
    window.addEventListener('wheel', (e) => {
        // @ts-ignore
        let rect = e.target.getBoundingClientRect()
        let pos = new Point(e.clientX, e.clientY);
        pos = pos.subtract(new Point(rect.x, rect.y))
        scene.handleWheelEvent(pos,e)
    })

    scene.setCanvas(canvas)
    scene.setSize(size)
    scene.layout()
    scene.redraw()
})





