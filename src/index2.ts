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
// ToggleButton mouse support
// TabbedBox    mouse support

Hover support for Buttons. Where does the state live?

ListView is custom VBox with NodeRenderer and clip and scrolling
need to fix VBox sizing



DropdownButton
    takes a menu list as its dropdown child
    enabled = true | false
    open = true | false
MenuList = VBox(main:shrink, cross:shrink, children:[menu items])
MenuItem = IconButton with no border + hover effect


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
import {CEvent, GElement} from "./base.ts";
import {HSeparator, Label, Square, Tag} from "./comps2.ts";
import {Icons} from "./icons.ts";
import {Button, CheckBox, IconButton, RadioButton} from "./buttons.ts";
import {MHBoxElement, MVBoxElement} from "./layout.ts";
import {TabbedBox} from "./tabbedBox.ts";
import {Scene} from "./scene.ts";

import {Schema} from "rtds-core";
import {ListView} from "./listView.ts";

const S = new Schema()
const Names = S.list(S.string()).cloneWith([
    "John",
    // "Jacob",
    // "Jingleheimer",
    // "Schmitd",
])
const NamesLong = S.list(S.string()).cloneWith([
    "John",
    "Jacob",
    "Jingleheimer",
    "Schmitd",
    "John",
    "Jacob",
    "Jingleheimer",
    "Schmitd",
    "John",
    "Jacob",
    "Jingleheimer",
    "Schmitd",
    "John",
    "Jacob",
    "Jingleheimer",
    "Schmitd",
])

const state = {
    toggle:false,
    checked:true,
    radioed: false,
    selectedTab: 1,
    selectedListItem: 0
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

    const listviewDemo = new MHBoxElement({
        background:'magenta',
        id:"list view demo",
        children:[
            ListView({
                data:["john","Jacob",'jingleheimer'],
                selected:state.selectedListItem,
                onSelectedChanged:((i: number, e: CEvent)=> {
                    state.selectedListItem = i
                    e.redraw()
                })
            }),
            ListView({
                data:["john","Jacob",'jingleheimer'],
                selected:state.selectedListItem,
                onSelectedChanged:((i: number, e: CEvent)=> {
                    state.selectedListItem = i
                    e.redraw()
                })
            })
        ]
    })

    let tabs = TabbedBox({
        titles:[
            'Components',
            'List View',
        ],
        children:[
            compsDemo,
            listviewDemo,
        ],
        selectedTab:state.selectedTab,
        onSelectedChanged(i: number, e:CEvent) {
            state.selectedTab = i;
            e.redraw()
        }
    })
    return tabs
}


const scene = new Scene(makeTree)
scene.init().then(() => {
    scene.layout()
    scene.redraw()
})





