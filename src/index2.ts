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

// ListView is custom VBox with NodeRenderer and clip and scrolling
// add listview scrolling. needs keydown/keyup to nav to next/prev
// need to fix VBox sizing

// add keyboard support. when listview has the focus let it nav up and down with arrow keys
// when a component has the focus, draw a focused border then switch back to the default
// screen tracks the current keyboard focus

// Hover support for Buttons. Where does the state live? in the render node?
//     has currentBg, swaps out with stdbg and hoverbg and selectionbg. if hoverbg is set
//focus is rendered on the render node
//    if currently focused, then swap out bg and border with stdbg and focusbg and selectedbg

// need a style object to represent the non-layout style of text color, borders, bg,

text input:
    draw a text render node + a rect for the cursor
    support cursor movement with left and right arrow keys
    support caps

support scrolling with scroll wheel events
make list view fill the width of the scroll parent by default


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

import {CEvent, GElement, MGlobals, SYMBOL_FONT_ENABLED} from "./base.ts";
import {HSeparator, Square} from "./comps2.ts";
import {Icon, Icons} from "./icons.ts";
import {Button, CheckBox, IconButton, RadioButton, Tag} from "./buttons.ts";
import {HBox, MHBoxElement, MVBoxElement} from "./layout.ts";
import {TabbedBox} from "./tabbedBox.ts";
import {Scene} from "./scene.ts";

import {ListView, ListViewItem} from "./listView.ts";
import {Point} from "josh_js_util";
import {ScrollContainer} from "./scroll.ts";
import {Label, TextBox} from "./text.ts";
import {EmailDemo} from "./demo/email.ts";
import {STATE_CACHE, StateCache} from "./state.ts";

// const S = new Schema()
// const Names = S.list(S.string()).cloneWith([
//     "John",
//     // "Jacob",
//     // "Jingleheimer",
//     // "Schmitd",
// ])
// const NamesLong = S.list(S.string()).cloneWith([
//     "John",
//     "Jacob",
//     "Jingleheimer",
//     "Schmitd",
//     "John",
//     "Jacob",
//     "Jingleheimer",
//     "Schmitd",
//     "John",
//     "Jacob",
//     "Jingleheimer",
//     "Schmitd",
//     "John",
//     "Jacob",
//     "Jingleheimer",
//     "Schmitd",
// ])

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
    textInputCursorPosition: new Point(5,0)
}


function makeTree(): GElement {
    const compsDemo = new MVBoxElement({
        children: [
            HBox({
                children: [
                    Label({text: 'simple components'}),
                    Button({text: "Button"}),
                    Button({
                        text: "toggle", selected: state.toggle, handleEvent: (e) => {
                            state.toggle = !state.toggle
                            e.redraw()
                        }
                    }),
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
                    Tag({text: 'tag'}),
                ],
            }),
            HBox({
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
            }),
            HBox({children:[
                Label({text: 'text input'}),
                TextBox({
                    cursorPosition: state.textInputCursorPosition,
                    inputid:"text-box-1",
                    text:state.textInputValue,
                    onChange:(v,e) => {
                        // console.log("new text input value",state.textInputValue)
                        state.textInputValue = v[0]
                        // state.textInputCursorPosition = v[1]
                        e.redraw()
                    }}),

            ]})
        ]
    })

    const listviewDemo = new MHBoxElement({
        id: "list view demo",
        fixedWidth: 200,
        children: [
            ListView({
                data: ["john", "Jacob", 'jingleheimer'],
                selected: state.selectedListItem1,
                onSelectedChanged: ((i: number, e: CEvent) => {
                    state.selectedListItem1 = i
                    e.redraw()
                })
            }),
            ListView({
                data: ["john", "Jacob", 'jingleheimer', 'foo', 'bar'],
                selected: state.selectedListItem2,
                renderItem: (item, selected, index, onSelectedChanged) => {
                    return ListViewItem({
                        mainAxisLayout:'between',
                        children: [
                            Label({text: item, shadow:true}),
                            new Icon({icon:Icons.DragHandle, shadow:true})
                        ],
                        selected: index === selected,
                        handleEvent: (e) => onSelectedChanged(index, e)
                    })
                },
                onSelectedChanged: ((i: number, e: CEvent) => {
                    state.selectedListItem2 = i
                    e.redraw()
                })
            })
        ]
    })

    const panelDemo = new MHBoxElement({
        children: [
            new MVBoxElement({
                children: [
                    Label({text: 'hbox'}),
                    new MHBoxElement({
                        children: [
                            Button({text: "one"}),
                            Button({text: "two"}),
                            Button({text: "three"}),
                        ]
                    })
                ]
            }),
            new MVBoxElement({
                children: [
                    Label({text: 'hbox'}),
                    new MVBoxElement({
                        children: [
                            Button({text: "one"}),
                            Button({text: "two"}),
                            Button({text: "three"}),
                        ]
                    })
                ]
            }),
            new MVBoxElement({
                children: [
                    Label({text: 'scroll container'}),
                    ScrollContainer({
                        fixedWidth: 150,
                        fixedHeight: 150,
                        scrollOffset: state.scrollOffset1,
                        onScrollChanged: (newOffset: Point, e: CEvent): void => {
                            state.scrollOffset1 = newOffset
                            e.redraw()
                        },
                        child: new MHBoxElement({
                            children: [
                                Square(20, 'red'),
                                Square(50, 'green'),
                                Square(200, 'blue'),
                            ]
                        })
                    })
                ]
            }),
            new MVBoxElement({
                children: [
                    Label({text: 'scrolling list'}),
                    ScrollContainer({
                        fixedWidth: 150,
                        fixedHeight: 200,
                        scrollOffset: state.scrollOffset2,
                        onScrollChanged: (newOffset: Point, e: CEvent): void => {
                            state.scrollOffset2 = newOffset
                            e.redraw()
                        },
                        child: ListView({
                            data: ["john", "Jacob", 'jingleheimer', 'foo', 'bar', 'baz', 'qux'],
                            selected: state.selectedListItem2,
                            onSelectedChanged: ((i: number, e: CEvent) => {
                                state.selectedListItem2 = i
                                e.redraw()
                            })
                        })
                    })
                ]
            })
        ]
    })

    const emailDemo = EmailDemo()

    let tabs = TabbedBox({
        titles: [
            'Components',
            'List View',
            'Panels',
            'Email',
        ],
        children: [
            compsDemo,
            listviewDemo,
            panelDemo,
            emailDemo,
        ],
        selectedTab: state.selectedTab,
        onSelectedChanged(i: number, e: CEvent) {
            state.selectedTab = i;
            e.redraw()
        }
    })
    return tabs
}


const scene = new Scene(makeTree)
MGlobals.set(Scene.name,scene)
MGlobals.set(SYMBOL_FONT_ENABLED, false)
MGlobals.set(STATE_CACHE, new StateCache())
// MGlobals.set(STYLE_)
scene.init().then(() => {
    scene.layout()
    scene.redraw()
})





