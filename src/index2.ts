/*

next steps

add back Icons and the various buttons that use icons
add back ListView. uses a renderer to create child elements. clips
create simple VBox that just lays out children vertically. assume grows in both dimensions.
add event handling back. event goes to render node, which then goes
    to a listener on that node which is the developer's code
different styles for components vs panels

Text is text without any insets
Label is text with padding and margins
Button is text with border and padding and margins
    states: enabled, hover, primary, secondary, destructive
Icon is reference to icon font with fixed size and no insets
IconButton is HBox shrinking with two children
CheckBox is IconButton with check icon and no border
RadioButton is IconButton with radio icon and no border
ToggleButton is Button with selected state
    selected = true | false
DropdownButton
    enabled = true | false
    open = true | false
MenuList = VBox(main:shrink, cross:shrink, children:[menu items])
MenuItem = IconButton with no border + hover effect

Tag is Text with fancy colored border and background
TabbedPane is VBox(main:grow, cross:grow, HBox(main:grow, cross:shrink,titles),currentContent)

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
import {doDraw, RenderContext, withInsets} from "./gfx.ts";
import {GElement, Style, ZERO_INSETS} from "./base.ts";
import {MHBoxElement, MHButton, TextElement} from "./comps2.ts";

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


function makeTree():GElement {
    return new MHBoxElement({
        mainAxisSelfLayout:'grow',
        crossAxisSelfLayout:'shrink',
        mainAxisLayout:'start',
        crossAxisLayout:'center',
        background:Style.panelBackgroundColor,
        padding: Style.panelPadding,
        margin: Style.panelMargin,
        borderWidth: Style.panelBorderWidth,
        borderColor:Style.panelBorderColor,
        children:[
            // Square(50,"red"),
            // new HExpander(),
            new TextElement({
                text:"Every text",
                padding: withInsets(5),
                font: Style.font,
                margin: withInsets(5),
                borderColor: 'transparent',
                borderWidth: ZERO_INSETS,
                backgroundColor:'transparent',
            }),
            MHButton({text:"hello"})
            // Square(50,"green"),
        ],
    })
}


const elementRoot = makeTree()
const renderRoot = elementRoot.layout(rc, {space:rc.size, layout:'grow'})
rc.ctx.save()
rc.ctx.scale(rc.scale, rc.scale)
// rc.ctx.translate(10,10)
rc.ctx.fillStyle = '#f0f0f0'
rc.ctx.fillRect(0,0,rc.size.w,rc.size.h);
doDraw(renderRoot,rc)
rc.ctx.restore()
