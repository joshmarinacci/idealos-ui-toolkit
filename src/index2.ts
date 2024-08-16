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

make HBox cross axis stretch to give all buttons the same height
make some options to Hbox and VBox be optional. good defaults.
ToggleButton is Button with selected state
    selected = true | false
TabbedPane is VBox(main:grow, cross:grow, HBox(main:grow, cross:shrink,titles),currentContent)


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


 */
import {makeCanvas} from "./util.ts";
import {Size} from "josh_js_util";
import {doDraw, RenderContext} from "./gfx.ts";
import {GElement} from "./base.ts";
import {HSeparator, Icon, Label, Tag} from "./comps2.ts";
import {Icons} from "./icons.ts";
import {Button, CheckBox, IconButton, RadioButton} from "./buttons.ts";
import {MHBoxElement, MVBoxElement} from "./layout.ts";
import {TabbedBox} from "./tabbedBox.ts";

const canvas = makeCanvas(new Size(600, 300))
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

let sc = 1 * window.devicePixelRatio
const rc: RenderContext = {
    canvas: canvas,
    ctx: ctx,
    scale: sc,
    debug: {
        metrics: false
    },
    size: new Size(canvas.width / sc, canvas.height / sc)
}


function makeTree(): GElement {
    const compsDemo = new MVBoxElement({
        crossAxisLayout: "center",
        crossAxisSelfLayout: "grow",
        mainAxisLayout: "center",
        mainAxisSelfLayout: "grow",
        children: [
            new MHBoxElement({
                mainAxisSelfLayout: 'grow',
                crossAxisSelfLayout: 'shrink',
                mainAxisLayout: 'start',
                crossAxisLayout: 'center',
                children: [
                    // Square(50,"red"),
                    // new HExpander(),
                    // MHLabel("Every Text"),
                    // MHButton({text: "hello"}),
                    // new Icon(Icons.Document),
                    // Square(50,"green"),
                    Label({text: 'simple components'}),
                    Button({text: "Button"}),
                    Button({text: "toggle", selected:true}),
                    // new Icon({icon: Icons.Document}),
                    IconButton({text: 'Doc', icon: Icons.Document, ghost: false}),
                    CheckBox({
                        text: "Checkbox",
                        // selected: state.checked, handleEvent: () => {
                        //     state.checked = !state.checked
                        //     c.redraw()
                        // }
                    }),
                    RadioButton({text: 'radio box'}),
                    Tag({text:'tag'}),
                    // ToggleButton(c, {text: 'toggle', selected: state.toggled, handleEvent: () => {
                    //         state.toggled = !state.toggled
                    //         c.redraw()
                    //     }})
                ],
            }),
            new MHBoxElement({
                mainAxisSelfLayout: 'grow',
                crossAxisSelfLayout: 'shrink',
                mainAxisLayout: 'start',
                crossAxisLayout: 'center',
                children: [
                    Label({text: 'toolbar'}),
                    new MHBoxElement({
                        crossAxisLayout: "center",
                        crossAxisSelfLayout: "shrink",
                        mainAxisLayout: "start",
                        mainAxisSelfLayout: "shrink",
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
    })
}


async function doit() {
    const font = new FontFace('material-icons',
        'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)')
    document.fonts.add(font)
    await font.load()
    const elementRoot = makeTree()
    const renderRoot = elementRoot.layout(rc, {space: rc.size, layout: 'grow'})
    rc.ctx.save()
    rc.ctx.scale(rc.scale, rc.scale)
// rc.ctx.translate(10,10)
    rc.ctx.fillStyle = '#f0f0f0'
    rc.ctx.fillRect(0, 0, rc.size.w, rc.size.h);
    doDraw(renderRoot, rc)
    rc.ctx.restore()
}

doit().then(() => console.log("is done"))

