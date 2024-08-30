import {describe, expect, it} from "vitest";
// import {Button} from "./buttons.ts";
import {RenderContext} from "./gfx.ts";
import {Size} from "josh_js_util";
import pureimage from "pureimage"
import {GRenderNode, LayoutConstraints} from "./base.ts";
import {HBox} from "./layout.ts";
import {KEY_VENDOR} from "./keys.ts";
import {Square} from "./comps2.ts";

function makeHeadlessRc() {
    const canvas = pureimage.make(500, 500)
    const ctx = canvas.getContext('2d')

    let sc = 1 * 1//window.devicePixelRatio
    const rc: RenderContext = {
        // @ts-ignore
        canvas: canvas,
        // @ts-ignore
        ctx: ctx,
        scale: sc,
        debug: {
            metrics: false
        },
        size: new Size(canvas.width / sc, canvas.height / sc)
    }
    return rc
}

function tabs(indent: number) {
    let str = ""
    for (let i = 0; i < indent; i++) {
        str += '  '
    }
    return str
}

function dump_keys(button_node: GRenderNode, indent?: number) {
    indent = indent || 0
    if (indent == 0) {
        console.log("KEYS")
    }
    console.log(tabs(indent), button_node.settings.kind, button_node.settings.key)
    button_node.settings.children.forEach(child => dump_keys(child, indent + 1))
}

describe("keys", () => {
    it("has keys", () => {
        const rc = makeHeadlessRc()
        const cons: LayoutConstraints = {space: rc.size, layout: 'grow'};

        KEY_VENDOR.reset()
        KEY_VENDOR.start()
        const root = HBox({
            mainAxisSelfLayout:'shrink',
            children: [
                Square(20,'red'),
                Square(20,'blue'),
                // Button({text: "hello"}),
                // Button({text: "world"}),
                // Label({text: "world"}),
                // Label({text: "world"}),
            ]
        })
        const root_node = root.layout(rc, cons)
        // const label = Label({text:"hello"})
        // const label_node = label.layout(rc,cons)
        KEY_VENDOR.end()
        dump_keys(root_node)
        // dump_keys(label_node)
        expect(root_node.settings.children.length).toEqual(2)
        expect(root_node.settings.key).toEqual("1")
        expect(root_node.settings.children[0].settings.key).toEqual("1.1")
        expect(root_node.settings.children[1].settings.key).toEqual("1.2")
        // expect(button_node.settings.key).toEqual(2)
    })
})

