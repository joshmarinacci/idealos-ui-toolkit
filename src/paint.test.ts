import {Scene} from "./scene.js";
import {describe, expect, it} from "vitest";
import {Square} from "./comps2.js";
import {Bounds, Logger, make_logger, Point, Size} from "josh_js_util";
import {RenderContext, RenderingSurface, TextOpts} from "./gfx.js";
import {Button} from "./buttons.js";
import {HBox, VBox} from "./layout.js";
import {AxisLayout, AxisSelfLayout, MGlobals, RenderNodeSettings, ZERO_INSETS} from "./base.js";
import {TextBox} from "./textinput.js";
import {STATE_CACHE, StateCache} from "./state.js";
class HeadlessRenderingSurface implements RenderingSurface {
    private logger: Logger;

    constructor() {
        this.logger = make_logger("HeadlessRenderingSurface");
        this.logger.setEnabled(false)
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
        l.setEnabled(false)
        const scene = new HeadlessScene({size: new Size(100, 100)})
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
        l.setEnabled(false)
        const scene = new HeadlessScene({size: new Size(100, 100)})
        scene.setComponentFunction(() => Button({text: "hi"}))
        l.info("made scene")
        scene.layout()
        // console.log(scene.renderRoot)
        expect(scene.renderRoot).toBeTruthy()
        expect(scene.renderRoot.settings.children.length).toBe(1)
        let text = scene.renderRoot.settings.children[0]
        // console.log(text)
        expect(text.settings.text).toBe("hi")
        expect(text.settings.pos).toEqual(new Point(8, 8))
        expect(text.settings.size).toEqual(new Size(20 + 2, 10 + 2))
    })
})

function BoxButton(text: string) {
    return Button({
        padding:ZERO_INSETS,
        borderWidth:ZERO_INSETS,
        text:text,
    })
}

function filterProps(settings: RenderNodeSettings, strings: (keyof RenderNodeSettings)[]) {
    return strings.map(key => {
        if(settings[key]){
            return `${key}: ${settings[key]}`
        }
    }).join("\n")
}

describe("layout", () => {
    it("should shrink HBox with one button", () => {
        const scene = new HeadlessScene({size: new Size(100, 100)})
        scene.setComponentFunction(() => HBox({
            mainAxisSelfLayout: 'shrink',
            children: [Button({
                text: "hi",
            })]
        }))
        scene.layout()
        expect(scene.renderRoot).toBeTruthy()
        expect(scene.renderRoot.settings.children.length).toBe(1)
        expect(scene.renderRoot.settings.kind).toBe("hbox")

        // 10 * chars + 1* 2 for border
        let text_size = new Size(10 * 2 + 2, 10 * 1 + 2)
        // 7 for padding and 1 for border
        let button_size = text_size.addPoint(new Point(7 * 2 + 1 * 2, 7 * 2 + 1 * 2))
        const button = scene.renderRoot.settings.children[0]
        // console.log("button",button, button_width)
        expect(button.settings.size).toEqual(button_size)
        const text = button.settings.children[0]
        expect(text.settings.size).toEqual(text_size)
    })
    it("should shrink HBox with two buttons", () => {
        const scene = new HeadlessScene({size: new Size(100, 100)})
        scene.setComponentFunction(() => HBox({
            mainAxisSelfLayout: 'shrink',
            borderWidth:ZERO_INSETS,
            padding:ZERO_INSETS,
            children: [
                Button({
                    padding: ZERO_INSETS,
                    borderWidth: ZERO_INSETS,
                    text: "hi",
                }),
                Button({
                    padding: ZERO_INSETS,
                    borderWidth: ZERO_INSETS,
                    text: "mi",
                }),
            ]
        }))
        scene.layout()
        expect(scene.renderRoot.settings.children.length).toBe(2)
        // a two letter button with zero padding & borders is 22x12
        expect(scene.renderRoot.settings.size).toEqual(new Size(22*2,12))

    })
    it("should grow HBox with different main axis layouts", () => {
        const scene = new HeadlessScene({size: new Size(100, 100)})
        function makeBox(masl:AxisSelfLayout ,mal:AxisLayout) {
            return function () {
                return HBox({
                    mainAxisSelfLayout: masl,
                    mainAxisLayout: mal,
                    borderWidth: ZERO_INSETS,
                    padding: ZERO_INSETS,
                    children: [
                        Button({
                            padding: ZERO_INSETS,
                            borderWidth: ZERO_INSETS,
                            text: "hi",
                        }),
                        Button({
                            padding: ZERO_INSETS,
                            borderWidth: ZERO_INSETS,
                            text: "mi",
                        }),
                    ]
                })
            }
        }

        // start
        scene.setComponentFunction(makeBox('grow',"start"))
        scene.layout()
        // a two letter button with zero padding & borders is 22x12
        expect(scene.renderRoot.settings.size).toEqual(new Size(100,12))
        expect(scene.renderRoot.settings.children[0].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[0].settings.pos).toEqual(new Point(0,0))
        expect(scene.renderRoot.settings.children[1].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[1].settings.pos).toEqual(new Point(22,0))

        // center
        scene.setComponentFunction(makeBox('grow',"center"))
        scene.layout()
        // a two letter button with zero padding & borders is 22x12
        expect(scene.renderRoot.settings.size).toEqual(new Size(100,12))
        expect(scene.renderRoot.settings.children[0].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[0].settings.pos).toEqual(new Point(100/2-22,0))
        expect(scene.renderRoot.settings.children[1].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[1].settings.pos).toEqual(new Point(100/2,0))

        // end
        scene.setComponentFunction(makeBox('grow',"end"))
        scene.layout()
        // a two letter button with zero padding & borders is 22x12
        expect(scene.renderRoot.settings.size).toEqual(new Size(100,12))
        expect(scene.renderRoot.settings.children[0].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[0].settings.pos).toEqual(new Point(100-44,0))
        expect(scene.renderRoot.settings.children[1].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[1].settings.pos).toEqual(new Point(100-22,0))

        // between
        scene.setComponentFunction(makeBox('grow',"between"))
        scene.layout()
        // a two letter button with zero padding & borders is 22x12
        expect(scene.renderRoot.settings.size).toEqual(new Size(100,12))
        expect(scene.renderRoot.settings.children[0].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[0].settings.pos).toEqual(new Point(0,0))
        expect(scene.renderRoot.settings.children[1].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[1].settings.pos).toEqual(new Point(100-22,0))
    })
    it('should grow VBox with different main axis layouts ', () => {
        const scene = new HeadlessScene({size: new Size(100, 100)})
        function makeBox(masl:AxisSelfLayout ,mal:AxisLayout) {
            return function () {
                return VBox({
                    mainAxisSelfLayout: masl,
                    mainAxisLayout: mal,
                    borderWidth: ZERO_INSETS,
                    padding: ZERO_INSETS,
                    children: [
                        Button({
                            padding: ZERO_INSETS,
                            borderWidth: ZERO_INSETS,
                            text: "hi",
                        }),
                        Button({
                            padding: ZERO_INSETS,
                            borderWidth: ZERO_INSETS,
                            text: "mi",
                        }),
                    ]
                })
            }
        }

        // vbox start
        scene.setComponentFunction(makeBox('grow',"start"))
        scene.layout()
        // a two letter button with zero padding & borders is 22x12
        expect(scene.renderRoot.settings.size).toEqual(new Size(22,100))
        expect(scene.renderRoot.settings.children[0].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[0].settings.pos).toEqual(new Point(0,0))
        expect(scene.renderRoot.settings.children[1].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[1].settings.pos).toEqual(new Point(0,12))

        // vbox center
        scene.setComponentFunction(makeBox('grow',"center"))
        scene.layout()
        // a two letter button with zero padding & borders is 22x12
        expect(scene.renderRoot.settings.size).toEqual(new Size(22,100))
        // console.log(scene.renderRoot.settings.children[0].settings.pos)
        expect(scene.renderRoot.settings.children[0].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[0].settings.pos).toEqual(new Point(0,100/2-12))
        expect(scene.renderRoot.settings.children[1].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[1].settings.pos).toEqual(new Point(0,100/2))

        // vbox end
        scene.setComponentFunction(makeBox('grow',"end"))
        scene.layout()
        // a two letter button with zero padding & borders is 22x12
        expect(scene.renderRoot.settings.size).toEqual(new Size(22,100))
        // console.log(scene.renderRoot.settings.children[0].settings.pos)
        expect(scene.renderRoot.settings.children[0].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[0].settings.pos).toEqual(new Point(0,100-24))
        expect(scene.renderRoot.settings.children[1].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[1].settings.pos).toEqual(new Point(0,100-12))

        // vbox between
        scene.setComponentFunction(makeBox('grow',"between"))
        scene.layout()
        // a two letter button with zero padding & borders is 22x12
        expect(scene.renderRoot.settings.size).toEqual(new Size(22,100))
        // console.log(scene.renderRoot.settings.children[0].settings.pos)
        expect(scene.renderRoot.settings.children[0].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[0].settings.pos).toEqual(new Point(0,0))
        expect(scene.renderRoot.settings.children[1].settings.size).toEqual(new Size(22,12))
        expect(scene.renderRoot.settings.children[1].settings.pos).toEqual(new Point(0,100-12))

    })
    it('should make HBox with fixed size', () => {
        const scene = new HeadlessScene({size: new Size(100,100)})
        function makeBox(layout:AxisLayout) {
            return function () {
                return HBox({
                    fixedWidth: 80,
                    fixedHeight: 80,
                    mainAxisLayout: layout,
                    borderWidth: ZERO_INSETS,
                    padding: ZERO_INSETS,
                    children: [
                        BoxButton("hi"),
                        BoxButton("hi"),
                    ]
                })
            }
        }

        // start
        {
            scene.setComponentFunction(makeBox("start"))
            scene.layout()
            expect(scene.renderRoot.settings.size).toEqual(new Size(80, 80))
            let first_child = scene.renderRoot.settings.children[0]
            expect(first_child.settings.size).toEqual(new Size(22, 12))
            expect(first_child.settings.pos).toEqual(new Point(0,0))
            let second_child = scene.renderRoot.settings.children[1]
            expect(second_child.settings.size).toEqual(new Size(22, 12))
            expect(second_child.settings.pos).toEqual(new Point(0+22,0))
        }

        // center
        {
            scene.setComponentFunction(makeBox("center"))
            scene.layout()
            expect(scene.renderRoot.settings.size).toEqual(new Size(80, 80))
            let first_child = scene.renderRoot.settings.children[0]
            expect(first_child.settings.size).toEqual(new Size(22, 12))
            expect(first_child.settings.pos).toEqual(new Point(40-22,0))
            let second_child = scene.renderRoot.settings.children[1]
            expect(second_child.settings.size).toEqual(new Size(22, 12))
            expect(second_child.settings.pos).toEqual(new Point(40,0))
        }

        // end
        {
            scene.setComponentFunction(makeBox("end"))
            scene.layout()
            expect(scene.renderRoot.settings.size).toEqual(new Size(80, 80))
            let first_child = scene.renderRoot.settings.children[0]
            expect(first_child.settings.size).toEqual(new Size(22, 12))
            expect(first_child.settings.pos).toEqual(new Point(80-22-22,0))
            let second_child = scene.renderRoot.settings.children[1]
            expect(second_child.settings.size).toEqual(new Size(22, 12))
            expect(second_child.settings.pos).toEqual(new Point(80-22,0))
        }



    })
    it('should make VBox with fixed size', () => {
        const scene = new HeadlessScene({size: new Size(100,100)})
        function makeBox(layout:AxisLayout) {
            return function () {
                return VBox({
                    fixedWidth: 80,
                    fixedHeight: 80,
                    mainAxisLayout:layout,
                    borderWidth: ZERO_INSETS,
                    padding: ZERO_INSETS,
                    children: [
                        BoxButton("hi"),
                        BoxButton("hi"),
                    ]
                })
            }
        }

        // start
        {
            scene.setComponentFunction(makeBox("start"))
            scene.layout()
            expect(scene.renderRoot.settings.size).toEqual(new Size(80, 80))
            let first_child = scene.renderRoot.settings.children[0]
            expect(first_child.settings.size).toEqual(new Size(22, 12))
            expect(first_child.settings.pos).toEqual(new Point(0,0))
            let second_child = scene.renderRoot.settings.children[1]
            expect(second_child.settings.size).toEqual(new Size(22, 12))
            expect(second_child.settings.pos).toEqual(new Point(0,0+12))
        }

        // center
        {
            scene.setComponentFunction(makeBox("center"))
            scene.layout()
            expect(scene.renderRoot.settings.size).toEqual(new Size(80, 80))
            let first_child = scene.renderRoot.settings.children[0]
            expect(first_child.settings.size).toEqual(new Size(22, 12))
            expect(first_child.settings.pos).toEqual(new Point(0,40-12))
            let second_child = scene.renderRoot.settings.children[1]
            expect(second_child.settings.size).toEqual(new Size(22, 12))
            expect(second_child.settings.pos).toEqual(new Point(0,40))
        }


        // end
        {
            scene.setComponentFunction(makeBox("end"))
            scene.layout()
            expect(scene.renderRoot.settings.size).toEqual(new Size(80, 80))
            // console.log(filterProps(scene.renderRoot.settings,['pos','size']))
            let first_child = scene.renderRoot.settings.children[0]
            // console.log(filterProps(first_child.settings,['pos','size']))
            expect(first_child.settings.size).toEqual(new Size(22, 12))
            expect(first_child.settings.pos).toEqual(new Point(0,80-12-12))
            let second_child = scene.renderRoot.settings.children[1]
            // console.log(filterProps(second_child.settings,['pos','size']))
            expect(second_child.settings.size).toEqual(new Size(22, 12))
            expect(second_child.settings.pos).toEqual(new Point(0,80-12))
        }
    })

    it("should grow textbox inside of HBox", () => {
        MGlobals.set(STATE_CACHE, new StateCache())
        const scene = new HeadlessScene({size: new Size(100,100)})
        function makeBox() {
            return function () {
                return HBox({
                    fixedWidth: 200,
                    fixedHeight: 30,
                    mainAxisLayout:"start",
                    borderWidth: ZERO_INSETS,
                    padding: ZERO_INSETS,
                    children: [
                        BoxButton("hi"),
                        TextBox({
                            multiline:false,
                            text:{
                            get:() => "hi",
                            set:(_v) => undefined,
                        }}),
                        BoxButton("hi"),
                    ]
                })
            }
        }
        scene.setComponentFunction(makeBox())
        scene.layout()
        expect(scene.renderRoot.settings.size).toEqual(new Size(200,30))
        // first box should be at 0,0 and size 22x12
        // last box should be at 200-22 and std size
        // text box should be stretched between 22 and 200-22

    })
})
