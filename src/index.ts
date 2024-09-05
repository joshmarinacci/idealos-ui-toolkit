import {MGlobals, MouseButton, SYMBOL_FONT_ENABLED} from "./base.ts";
import {Scene} from "./scene.ts";
import {STATE_CACHE, StateCache} from "./state.ts";
import {setup_common_keybindings} from "./actions.ts";
import {makeCanvas} from "./util.js";
import {Point, Size} from "josh_js_util";
import {MinesweeperApp} from "./minesweeper.js";
import {DrawingApp} from "./drawing.js";

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

const size =new Size(1000,600)

async function loadFont() {
    // const font = new FontFace('material-icons',
    //     'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)')
    const font = new FontFace('material-icons',
        'url(material-symbols/material-symbols-outlined.woff2)');
    document.fonts.add(font)
    await font.load()
}


// const doit = () => MWindow({ child:EmailDemo()})
// const doit = () => makeTabs()
// const doit = () => MinesweeperApp()
const doit = () => DrawingApp()
// const doit = () => EmailDemo()
// const doit = () => EmailDemo()
// const doit = () => makeCompsDemo()
// const doit = () => baselineRow()
// const doit = () => Button({text:"Button"})
// const doit = () => testList()
setup_common_keybindings()
const scene = new Scene(doit)
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





