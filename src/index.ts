import {MGlobals, SYMBOL_FONT_ENABLED} from "./base.ts";
import {Scene} from "./scene.ts";
import {Point, Size} from "josh_js_util";
import {STATE_CACHE, StateCache} from "./state.ts";
import {setup_common_keybindings} from "./actions.ts";
import {makeTabs} from "./demo.ts";

const state = {
    toggle: false,
    checked: true,
    radioed: false,
    selectedTab: 0,
    selectedListItem1: 0,
    selectedListItem2: 0,
    scrollOffset1: new Point(0, 0),
    scrollOffset2: new Point(0, 0),
    textInputValue: "some long text",
    textInputCursorPosition: new Point(5, 0)
}


setup_common_keybindings()
const scene = new Scene(makeTabs)
MGlobals.set(Scene.name, scene)
MGlobals.set(SYMBOL_FONT_ENABLED, true)
MGlobals.set(STATE_CACHE, new StateCache())
scene.init(new Size(800,600)).then(() => {
    scene.layout()
    scene.redraw()
})





