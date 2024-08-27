import {HBox, HSpacer, MHBoxElement, MVBoxElement} from "./layout.js";
import {Label, TextBox, WrappingLabel} from "./text.js";
import {Button, CheckBox, DropdownButton, IconButton, RadioButton, Tag, ToggleButton} from "./buttons.js";
import {IconElement, Icons} from "./icons.js";
import {HSeparator, Square} from "./comps2.js";
import {ListView, ListViewItem} from "./listView.js";
import {ScrollContainer} from "./scroll.js";
import {GElement} from "./base.js";
import {EmailDemo} from "./email.js";
import {TabbedBox} from "./tabbedBox.js";
import {MWindow} from "./window.js";

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
                        // selected: {
                        //     get: () => state.toggle,
                        //     set: (value) => state.toggle = value,
                        // }
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
                    Label({text: 'toolbar'}),
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
            // HBox({
            //     children: [
            //         Label({ text:'inputs'}),
            //         TextBox({
            //             text:'hello there'
            //             // text: state.textInputValue,
            //             // multiline: false,
            //             // onChange: (v, e) => {
            //             //     state.textInputValue = v[0]
            //             //     e.redraw()
            //             // }
            //         }),
            //     ]
            // })
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
                // selected: {
                //     get: () => state.selectedListItem1,
                //     set: (value) => state.selectedListItem1 = value
                // },
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
                            os(index, e)
                        }
                    })
                }
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
                        key: 'scroll-1',
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
                        key: 'scroll-2',
                        // scrollOffset: state.scrollOffset2,
                        // onScrollChanged: (newOffset: Point, e: CEvent): void => {
                        //     state.scrollOffset2 = newOffset
                        //     e.redraw()
                        // },
                        child: ListView({
                            data: ["john", "Jacob", 'jingleheimer', 'foo', 'bar', 'baz', 'qux'],
                            key: 'list-view-xx',
                            // selected: state.selectedListItem2,
                            // onSelectedChanged: ((i: number, e: CEvent) => {
                            //     state.selectedListItem2 = i
                            //     e.redraw()
                            // })
                        })
                    })
                ]
            })
        ]
    })
}

export function makeTabs(): GElement {
    const compsDemo = makeCompsDemo()
    const listviewDemo = makeListDemo()
    const panelDemo = makePanelDemo()
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
    })
    return MWindow({child: tabs})
}
