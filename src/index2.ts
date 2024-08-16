/*

next steps

// Text is text without any insets
// Label is text with padding and margins
// Button is text with border and padding and margins
//     states: enabled, hover, primary, secondary, destructive
// Icon is reference to icon font with fixed size and no insets
// IconButton is HBox shrinking with two children
// CheckBox is IconButton with check icon and no border
// RadioButton is IconButton with radio icon and no border
// Tag is Text with fancy colored border and background
// make HBox cross axis stretch to give all buttons the same height
// make some options to Hbox and VBox be optional. good defaults.
// ToggleButton is Button with selected state
//    selected = true | false
// TabbedPane is VBox(main:grow, cross:grow, HBox(main:grow, cross:shrink,titles),currentContent)

DropdownButton
    takes a menu list as its dropdown child
    enabled = true | false
    open = true | false
MenuList = VBox(main:shrink, cross:shrink, children:[menu items])
MenuItem = IconButton with no border + hover effect

ListView is custom VBox with NodeRenderer and clip and scrolling
HSpacer is h growing
VSpacer is v growing
TextBox = HBox(TextInput,ClearButton,)
    with custom focus and borders
    enabled & disabled
    focused & not focused
SearchBox = HBox(SearchIcon,TextInput)
ToggleGroup HBox(with mutually exclusive options)
ColorWell


input:
  mouse down, move, up
  pick repeatedly when not down
  when down, keep sending event to same target until up again

 */
import {makeCanvas} from "./util.ts";
import {Bounds, Point, Size} from "josh_js_util";
import {doDraw, RenderContext} from "./gfx.ts";
import {CEvent, GElement, GRenderNode} from "./base.ts";
import {HSeparator, Label, Tag} from "./comps2.ts";
import {Icons} from "./icons.ts";
import {Button, CheckBox, IconButton, RadioButton} from "./buttons.ts";
import {MHBoxElement, MVBoxElement} from "./layout.ts";
import {TabbedBox} from "./tabbedBox.ts";


const state = {
    toggle:false,
    checked:true,
    radioed: false,
    selectedTab: 0
}
function makeTree(): GElement {
    const compsDemo = new MVBoxElement({
        children: [
            new MHBoxElement({
                children: [
                    // Square(50,"red"),
                    // new HExpander(),
                    // MHLabel("Every Text"),
                    // MHButton({text: "hello"}),
                    // new Icon(Icons.Document),
                    // Square(50,"green"),
                    Label({text: 'simple components'}),
                    Button({text: "Button"}),
                    Button({text: "toggle", selected:state.toggle, handleEvent:(e) => {
                        console.log('e')
                            state.toggle = !state.toggle
                            e.redraw()
                        }}),
                    // new Icon({icon: Icons.Document}),
                    IconButton({text: 'Doc', icon: Icons.Document, ghost: false}),
                    CheckBox({
                        text: "Checkbox",
                        selected: state.checked,
                        handleEvent: (e) => {
                            state.checked = !state.checked
                            e.redraw()
                        }
                    }),
                    RadioButton({
                        text: 'radio box',
                        selected: state.radioed,
                        handleEvent: (e) => {
                            state.radioed = !state.radioed
                            e.redraw()
                        }
                    }),
                    Tag({text:'tag'}),
                    // ToggleButton(c, {text: 'toggle', selected: state.toggled, handleEvent: () => {
                    //         state.toggled = !state.toggled
                    //         c.redraw()
                    //     }})
                ],
            }),
            new MHBoxElement({
                crossAxisLayout: 'center',
                children: [
                    Label({text: 'toolbar'}),
                    new MHBoxElement({
                        crossAxisLayout: "center",
                        children: [
                            Button({text: "Button"}),
                            IconButton({text: 'IconButton', icon: Icons.Document, ghost: false}),
                            IconButton({icon: Icons.Document, text: "", ghost: false}),
                            new HSeparator(),
                            IconButton({icon: Icons.Document, text: "", ghost: false}),
                        ]
                    }),
                ]
            })
        ]
    })

    const secondDemo = new MVBoxElement({
        children:[
            Button({text: "second demo"}),
        ]
    })

    return TabbedBox({
        titles:[
            'Components',
            'Second',
        ],
        children:[
            compsDemo,
            secondDemo,
        ],
        selectedTab:state.selectedTab,
        onSelectedChanged(i: number, e:CEvent) {
            state.selectedTab = i;
            console.log("set tab to",i)
            e.redraw()
        }
    })
}


class Scene {
    private elementRoot: GElement;
    renderRoot: GRenderNode;
    canvas: HTMLCanvasElement;
    private last :GRenderNode | undefined

    async init() {
        const font = new FontFace('material-icons',
            'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)')
        document.fonts.add(font)
        await font.load()

        this.canvas = makeCanvas(new Size(600, 300))
        this.last = undefined
        this.canvas.addEventListener('mousemove',(e) => {
            // @ts-ignore
            let rect = e.target.getBoundingClientRect()
            let pos = new Point(e.clientX, e.clientY);
            pos = pos.subtract(new Point(rect.x,rect.y))
            this.handleMouseMove(pos)
        })
        this.canvas.addEventListener('mousedown',(e) => {
            // @ts-ignore
            let rect = e.target.getBoundingClientRect()
            let pos = new Point(e.clientX, e.clientY);
            pos = pos.subtract(new Point(rect.x,rect.y))
            this.handleMouseDown(pos)
        })
    }
    makeRc() {
        const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D

        let sc = 1 * window.devicePixelRatio
        const rc: RenderContext = {
            canvas: this.canvas,
            ctx: ctx,
            scale: sc,
            debug: {
                metrics: false
            },
            size: new Size(this.canvas.width / sc, this.canvas.height / sc)
        }
        return rc
    }
    layout() {
        let rc = this.makeRc()
        this.elementRoot = makeTree()
        this.renderRoot = this.elementRoot.layout(rc, {space: rc.size, layout: 'grow'})
    }
    redraw() {
        let rc = this.makeRc()
        rc.ctx.save()
        rc.ctx.scale(rc.scale, rc.scale)
        // rc.ctx.translate(10,10)
        rc.ctx.fillStyle = '#f0f0f0'
        rc.ctx.fillRect(0, 0, rc.size.w, rc.size.h);
        doDraw(this.renderRoot, rc)
        rc.ctx.restore()
    }

    private findTarget(pos: Point, node: GRenderNode):GRenderNode|undefined {
        const bounds = Bounds.fromPointSize(node.settings.pos, node.settings.size)
        if(bounds.contains(pos)) {
            if(node.settings.children) {
                for (let ch of node.settings.children) {
                    // console.log("ch under mouse is",ch)
                    if(ch.settings.shadow) continue
                    let p2 = pos.subtract(bounds.top_left())
                    let found = this.findTarget(p2, ch)
                    if(found) return found
                }
            }
            return node
        }
    }

    handleMouseMove(pos: Point) {
        let found = this.findTarget(pos,scene.renderRoot)
        // console.log("mouse at",pos,found?found.settings.id:"nothing")
        if(found) {
            if(found !== this.last) {
                if(this.last) {
                    // this.last.settings.background = 'white'
                }
                // found.settings.background = 'blue'
                scene.redraw()
                this.last = found
            }
        }
    }
    handleMouseDown(pos: Point) {
        let found = this.findTarget(pos,scene.renderRoot)
        if(found && found.settings.handleEvent) found.settings.handleEvent({
            type:"mouse-down",
            redraw:() => {
                this.layout()
                this.redraw()
            },
        })
    }
}

const scene = new Scene()
scene.init().then(() => {
    scene.layout()
    scene.redraw()
})





