import {HBox, HSpacer, MHBoxElement, MVBoxElement, VBox} from "../layout.js";
import {Label, WrappingLabel} from "../text.js";
import {Button, CheckBox, IconButton, RadioButton, Tag, ToggleButton, ToggleGroup} from "../buttons.js";
import {IconElement, Icons} from "../icons.js";
import {HSeparator, Square} from "../comps2.js";
import {ListView, ListViewItem} from "../listView.js";
import {ScrollContainer} from "../scroll.js";
import {GElement, ZERO_INSETS} from "../base.js";
import {makeEmailApp} from "./email.js";
import {TabbedBox} from "../tabbedBox.js";
import {MWindow} from "../window.js";
import {makeTodolistDemo} from "../todolist.js";
import {Point, Size} from "josh_js_util";
import {NumberBox, ActionBox, TextBox} from "../textinput.js";
import {Style} from "../style.js";
import {makeMinesweeperApp} from "./minesweeper.js";
import {makeWeatherApp} from "./weather.js";
import {makeClockApp} from "./clock.js";
import {ContactsApp} from "./contacts.js";
import {TextEditor} from "./texteditor.js";
import {PropSheet} from "../propsheet.js";
import {ObjMap, Schema} from "rtds-core";


const state = {
    textInputValue: "yo",
    toggle:false
}

export function makeBaselineRow() {
    return HBox({
        mainAxisSelfLayout:"grow",
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

export function makeButton() {
    return ToggleButton({
        text:"hi there"
    })
}
export function makeCompsDemo() {
    return new MVBoxElement({
        mainAxisLayout:'start',
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
                    VBox({
                        children:[
                            TextBox({
                                text: {
                                    get: () => state.textInputValue,
                                    set: (value) => state.textInputValue = value,
                                },
                                fixedWidth: 100,
                            }),
                            NumberBox({
                                value:55,
                                fixedWidth: 100,
                            })
                        ]
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
        mainAxisLayout:"center",
        crossAxisLayout: 'center',
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
                fixedHeight: 150,
                child: ListView({
                    data: ["john", "Jacob", 'jingleheimer', 'foo', 'bar', 'baz', 'qux','foo', 'bar', 'baz', 'qux',],
                    key: 'list-view-xx',
                })
            })
        ]
    })
}


export function makeScrollDemo() {
    const scroll = ScrollContainer({
        // fixedWidth: 150,
        // fixedHeight: 150,
        child: ListView({
            fixedHeight:300,
            data: ["john", "Jacob", 'jingleheimer', 'foo', 'bar', 'baz', 'qux','foo', 'bar', 'baz', 'qux',],
            key: 'list-view-xx',
        })
    })
    return MWindow({child: scroll, initSize: new Size(300,300)})
}
export function makePanelDemo() {
    return new MHBoxElement({
        mainAxisLayout: 'between',
        mainAxisSelfLayout: 'grow',
        crossAxisSelfLayout: 'grow',
        crossAxisLayout:'start',
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
    const emailDemo = makeEmailApp()
    const todoDemo = makeTodolistDemo()
    const mine_app = makeMinesweeperApp()
    const clock_app = makeClockApp()
    const weatherApp = makeWeatherApp()
    const mine_scroll = ScrollContainer({
        child:mine_app,
    })
    const contacts = ContactsApp()
    const textEditor = TextEditor()

    let tabs = TabbedBox({
        titles: [
            'Components',
            // 'List View',
            // 'Panels',
            'Email',
            'Todo List',
            'Minesweeper',
            'Clock',
            'Weather',
            'Contacts',
            'Editor',
        ],
        children: [
            compsDemo,
            // listviewDemo,
            // panelDemo,
            emailDemo,
            todoDemo,
            mine_scroll,
            clock_app,
            weatherApp,
            contacts,
            textEditor,
        ],
    })
    return MWindow({child: tabs, initSize: new Size(700,300)})
}

export function TextInputTest() {
    return VBox({
        children:[
            TextBox({
                multiline:false,
                fixedWidth: 300,
                fontSize: 50,
            }),
            ActionBox({
                fixedWidth: 300,
                fontSize:50,
                action: (text:string) => {
                    console.log("did an action with text",text)
                }
            }),
            NumberBox({
                // value:56,
                fixedWidth: 300,
                fontSize:50,
            })
        ]
    })
}
export function LayoutTest() {
    const child =  VBox({
        // fixedWidth: 200,
        // fixedHeight: 300,
        mainAxisSelfLayout:"grow",
        mainAxisLayout:"end",
        // crossAxisLayout:"center",
        borderWidth: ZERO_INSETS,
        padding: ZERO_INSETS,
        visualStyle: {
            background: 'cyan'
        },
        children: [
            Button({text:"hi"}),
            // ListView({
            //    fixedHeight: 100,
            //    fixedWidth: 100,
            //    data:["A","B","C"],
            // }),
            // Button({text:"hi"}),
            ListView({
                // fixedHeight: 100,
                mainAxisSelfLayout:'grow',
                data:["A","B","C"],
            }),
            Button({text:"hi"}),
        ]
    })
    child.log.setEnabled(true)
    return MWindow({child: child, initSize: new Size(700,400)})

}

const S = new Schema()
const Position = S.jsobj(new Point(50, 50), {
    typeName: 'Position',
    fromJson: (j) => Point.fromJSON(j),
})
const SizeAtom = S.jsobj(new Size(25, 25), {
    typeName: 'Size',
    fromJson: (j) => Size.fromJSON(j),
})
const Color = S.map({
    r: S.number(0, {
        hints: {
            "min":0,
            "max":1.0,
            "format":"float",
            step:0.1,
        }
    }),
    g: S.number(0),
    b: S.number(0),
})

const Rect = S.map({
    position: Position,
    size: SizeAtom,
    name: S.string('unnamed rect'),
    fill: Color,
}, {typeName: 'Rect'})

const rect = Rect.clone()
export function PropSheetTest() {
    return PropSheet({
        fixedWidth: 300,
        target:rect as ObjMap<any>
    })
}
