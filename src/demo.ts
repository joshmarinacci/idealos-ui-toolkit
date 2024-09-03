import {HBox, HSpacer, MHBoxElement, MVBoxElement} from "./layout.js";
import {Label, TextBox, WrappingLabel} from "./text.js";
import {Button, CheckBox, IconButton, RadioButton, Tag, ToggleButton, ToggleGroup} from "./buttons.js";
import {IconElement, Icons} from "./icons.js";
import {HSeparator, Square} from "./comps2.js";
import {ListView, ListViewItem, TreeView} from "./listView.js";
import {ScrollContainer} from "./scroll.js";
import {GElement} from "./base.js";
import {EmailDemo} from "./email.js";
import {TabbedBox} from "./tabbedBox.js";
import {MWindow} from "./window.js";
import {TodoListDemo} from "./todolist.js";
import {Size} from "josh_js_util";


const state = {
    textInputValue: "yo",
    toggle:false
}

export function baselineRow() {
    return HBox({
        crossAxisLayout: 'center',
        children: [
            Label({text: 'simple components'}),
            HSpacer(),
            Button({text: "Button"}),
            ToggleButton({
                text: "toggle",
                selected: {
                    get: () => state.toggle,
                    set: (value) => state.toggle = value,
                }
            }),
            IconButton({text: 'Doc', icon: Icons.Document, ghost: false}),
            CheckBox({
                text: "Checkbox",
                // selected: state.checked,
                // handleEvent: (e) => {
                //     if (e.type === 'mouse-down') {
                //         state.checked = !state.checked
                //         e.redraw()
                //     }
                // }
            }),
            RadioButton({
                text: 'radio box',
                // selected: state.radioed,
                // handleEvent: (e) => {
                //     if (e.type === 'mouse-down') {
                //         state.radioed = !state.radioed
                //         e.redraw()
                //     }
                // }
            }),
            Tag({text: 'tag'}),
        ],
    })
}

export function makeCompsDemo() {
    return new MVBoxElement({
        children: [
            HBox({
                crossAxisLayout: 'center',
                children: [
                    Label({text: 'simple components'}),
                    Button({text: "Button"}),
                    ToggleButton({
                        text: "toggle",
                        selected: {
                            get: () => state.toggle,
                            set: (value) => state.toggle = value,
                        }
                    }),
                    IconButton({text: 'Doc', icon: Icons.Document, ghost: false}),
                    HSpacer(),
                    CheckBox({
                        text: "Checkbox",
                        // selected: state.checked,
                        // handleEvent: (e) => {
                        //     if (e.type === 'mouse-down') {
                        //         state.checked = !state.checked
                        //         e.redraw()
                        //     }
                        // }
                    }),
                    RadioButton({
                        text: 'radio box',
                        // selected: state.radioed,
                        // handleEvent: (e) => {
                        //     if (e.type === 'mouse-down') {
                        //         state.radioed = !state.radioed
                        //         e.redraw()
                        //     }
                        // }
                    }),
                    Tag({text: 'tag'}),
                ],
            }),
            HBox({
                crossAxisLayout: 'center',
                children: [
                    Label({text: 'grouped'}),
                    new MHBoxElement({
                        crossAxisLayout: "center",
                        visualStyle: {
                            background: '#333'
                        },
                        children: [
                            Button({text: "Button", key: "first-button"}),
                            IconButton({text: 'IconButton', icon: Icons.Document, ghost: false, key: "second-button"}),
                            IconButton({icon: Icons.Document, text: "", ghost: false}),
                            new HSeparator(),
                            IconButton({icon: Icons.Document, text: "", ghost: false}),
                        ]
                    }),
                    ToggleGroup({
                        data:["Good","Evil", "Neutral"],
                    })
                ]
            }),
            HBox({
                crossAxisLayout: 'center',
                children: [
                    Label({text: 'labels'}),
                    Label({text: 'bold', bold:true}),
                    Label({text: 'line with\n newlines', multiline: true}),
                    WrappingLabel({
                        text: "This is a long label without a newline that should be wrapped properly.",
                        fixedWidth: 200,
                    })
                ]
            }),
            // HBox({
            //     mainAxisSelfLayout: 'shrink',
            //     crossAxisLayout: 'center',
            //     children: [
            //         Label({text: "popup"}),
            //         DropdownButton({
            //             text: "open popup",
            //             children: [
            //                 Button({text: "popup"}),
            //                 Button({text: "popup"}),
            //                 Button({text: "popup"}),
            //                 Button({text: "popup"}),
            //             ]
            //         }),
            //     ]
            // }),
            HBox({
                children: [
                    Label({ text:'inputs'}),
                    TextBox({
                        text: {
                            get: () => state.textInputValue,
                            set: (value) => state.textInputValue = value,
                        },
                        multiline:false,
                    }),
                    TextBox({
                        // text:'multi-line text area',
                        multiline:true,
                        fixedWidth: 200,
                        fixedHeight: 80,
                    }),
                ]
            })
        ]
    })
}

export function makeListDemo() {
    return new MHBoxElement({
        kind: "list view demo",
        fixedWidth: 200,
        children: [
            ListView({
                data: ["john", "Jacob", 'jingleheimer'],
            }),
            ListView({
                data: ["john", "Jacob", 'jingleheimer', 'foo', 'bar'],
                renderItem: (item, selected, index, os) => {
                    return ListViewItem({
                        mainAxisLayout: 'between',
                        children: [
                            Label({text: item, shadow: true}),
                            new IconElement({icon: Icons.DragHandle, shadow: true})
                        ],
                        selected: index === selected,
                        handleEvent: (e) => {
                            if(e.type === 'mouse-down') {
                                return os(index, e)
                            }
                        }
                    })
                }
            }),
            ScrollContainer({
                fixedWidth: 150,
                fixedHeight: 200,
                child: ListView({
                    data: ["john", "Jacob", 'jingleheimer', 'foo', 'bar', 'baz', 'qux'],
                    key: 'list-view-xx',
                })
            })
        ]
    })
}

export function makePanelDemo() {
    return new MHBoxElement({
        mainAxisLayout: 'between',
        mainAxisSelfLayout: 'grow',
        crossAxisSelfLayout: 'grow',
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
                    Label({text: 'vbox'}),
                    new MVBoxElement({
                        crossAxisLayout: 'center',
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
        ]
    })
}

export function testList() {
    return ListView({
        data: ["john", "Jacob", 'jingleheimer'],
    })
}

export function makeTabs(): GElement {
    const compsDemo = makeCompsDemo()
    const listviewDemo = makeListDemo()
    const panelDemo = makePanelDemo()
    const emailDemo = EmailDemo()
    const todoDemo = TodoListDemo()

    let tabs = TabbedBox({
        titles: [
            'Components',
            'List View',
            'Panels',
            'Email',
            'Todo List'
        ],
        children: [
            compsDemo,
            listviewDemo,
            panelDemo,
            emailDemo,
            todoDemo,
        ],
    })
    return MWindow({child: tabs, initSize: new Size(700,400)})
}


export function makeTree():GElement {
    return new TreeView({
    })
}
