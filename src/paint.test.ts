import {Scene} from "./scene.js";
import {describe, expect, it} from "vitest";
import {Square} from "./comps2.js";
import {Bounds, Logger, make_logger, Point, Size} from "josh_js_util";
import {RenderContext, RenderingSurface, TextOpts} from "./gfx.js";
import {Button} from "./buttons.js";

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
        const scene = new HeadlessScene({})
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
        const scene = new HeadlessScene({})
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
