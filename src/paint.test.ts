import {Scene} from "./scene.js";
import {describe, expect, it} from "vitest";
import {Square} from "./comps2.js";
import {Bounds, Logger, make_logger, Point, Size} from "josh_js_util";
import {RenderContext, RenderingSurface, TextOpts} from "./gfx.js";
import {Button} from "./buttons.js";
import {HBox} from "./layout.js";

class HeadlessRenderingSurface implements RenderingSurface {
    private logger: Logger;

    constructor() {
        this.logger = make_logger("HeadlessRenderingSurface");
    }

    measureText(text: string, opts: TextOpts): [Size, number] {
        this.logger.info("measureText", opts, text);
        return [
            new Size(text.length * 10, 10),
            10,
        ]
    }

    fillText(text: string, _pos: Point, _opts?: TextOpts): void {
        this.logger.info(`fillText ${text}`)
        // throw new Error("Method not implemented.");
    }

    clipRect(bounds: Bounds): void {
        this.logger.info(`clipRect ${bounds}`)
    }

    strokeBounds(bounds: Bounds, _color: string, _thickness: number): void {
        this.logger.info(`strokeBounds ${bounds}`)
    }

    save() {
    }

    scale() {
    }

    restore() {
    }

    fillRect(_bounds: Bounds, _color: string): void {
    }

    translate() {
    }
}

class HeadlessScene extends Scene {
    protected makeRc(): RenderContext {
        return {
            size: this.opts.size,
            scale: 1,
            surface: new HeadlessRenderingSurface()
        }
    }
}

describe("scene repainting", () => {
    it("should paint the scene", async () => {
        const l = make_logger("test")
        const scene = new HeadlessScene({size:new Size(100,100)})
        scene.setComponentFunction(() => Square(50, 'red'))
        l.info("made scene")
        scene.layout()
        // console.log(scene.renderRoot)
        expect(scene.renderRoot).toBeTruthy()
        expect(scene.renderRoot.settings.kind).toBe("square")
        expect(scene.renderRoot.settings.size).toEqual(new Size(50, 50))
        l.info("did layout")
        scene.redraw()
        l.info("did redraw")
    })
    it("should paint a button", () => {
        const l = make_logger("test")
        const scene = new HeadlessScene({size:new Size(100,100)})
        scene.setComponentFunction(() => Button({text: "hi"}))
        l.info("made scene")
        scene.layout()
        console.log(scene.renderRoot)
        expect(scene.renderRoot).toBeTruthy()
        expect(scene.renderRoot.settings.children.length).toBe(1)
        let text = scene.renderRoot.settings.children[0]
        console.log(text)
        expect(text.settings.text).toBe("hi")
        expect(text.settings.pos).toEqual(new Point(8, 8))
        expect(text.settings.size).toEqual(new Size(20 + 2, 10 + 2))
    })
})
describe("layout", () => {
    function expand(size: Size, point: Point) {
        return new Size(
            size.w + point.x,
            size.h + point.y
        )
    }

    it("should shrink HBox with one button", () => {
        const scene = new HeadlessScene({size:new Size(100,100)})
        scene.setComponentFunction(() => HBox({
            mainAxisSelfLayout:'shrink',
            children:[Button({
                text: "hi",
            })]}))
        scene.layout()
        console.log(scene.renderRoot)
        expect(scene.renderRoot).toBeTruthy()
        expect(scene.renderRoot.settings.children.length).toBe(1)
        expect(scene.renderRoot.settings.kind).toBe("hbox")
        // const hbox = scene.renderRoot

        // 10 * chars + 1* 2 for border
        let text_size = new Size(10*2+2, 10*1+2)
        // 7 for padding and 1 for border
        let button_size = expand(text_size, new Point(7*2 + 1*2, 7*2 + 1*2))
        const button = scene.renderRoot.settings.children[0]
        // console.log("button",button, button_width)
        expect(button.settings.size).toEqual(button_size)
        const text = button.settings.children[0]
        expect(text.settings.size).toEqual(text_size)
    })
})
