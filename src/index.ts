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
import {setup_common_keybindings} from "./actions.ts";

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
                key:"first-list-view",
                data: ["john", "Jacob", 'jingleheimer'],
                // selected: state.selectedListItem1,
                // onSelectedChanged: ((i: number, e: CEvent) => {
                //     state.selectedListItem1 = i
                //     e.redraw()
                // })
            }),
            ListView({
                key:"second-list-view",
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
                        key:'scroll-1',
                        // scrollOffset: state.scrollOffset1,
                        // onScrollChanged: (newOffset: Point, e: CEvent): void => {
                        //     state.scrollOffset1 = newOffset
                        //     e.redraw()
                        // },
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
                        key:'scroll-2',
                        // scrollOffset: state.scrollOffset2,
                        // onScrollChanged: (newOffset: Point, e: CEvent): void => {
                        //     state.scrollOffset2 = newOffset
                        //     e.redraw()
                        // },
                        child: ListView({
                            data: ["john", "Jacob", 'jingleheimer', 'foo', 'bar', 'baz', 'qux'],
                            key:'list-view-xx',
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


setup_common_keybindings()
const scene = new Scene(makeTree)
MGlobals.set(Scene.name,scene)
MGlobals.set(SYMBOL_FONT_ENABLED, true)
MGlobals.set(STATE_CACHE, new StateCache())
// MGlobals.set(STYLE_)
scene.init().then(() => {
    scene.layout()
    scene.redraw()
})





