import {IconElement, Icons} from "./icons.js";
import {
    EventHandler,
    GElement,
    GRenderNode,
    LayoutConstraints,
    MGlobals,
    StateHandler,
    TRANSPARENT,
    useState,
    VisualStyle,
    ZERO_INSETS
} from "./base.js";
import {HBox, MHBoxElement, VBox} from "./layout.js";
import {Style} from "./style.js";
import {Insets} from "josh_js_util";
import {TextElement} from "./text.js";
import {RenderContext, withInsets} from "./gfx.js";
import {KEY_VENDOR} from "./keys.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {PopupContainer} from "./popup.js";
import {ObjList} from "rtds-core";

type ButtonParameters = {
    margin?:Insets,
    borderWidth?: Insets
    borderColor?: string
    padding?:Insets,
    text?:string,
    selected?:boolean
    handleEvent?: EventHandler
    borderRadius?: Insets | number
    key?: string
}
type IconButtonParameters = {
    icon: Icons
    ghost?: boolean
    hoverStyle?:VisualStyle
} & ButtonParameters;

export function IconButton(opts: IconButtonParameters) {
    return new MHBoxElement({
        visualStyle: {
            borderColor:opts.ghost ? TRANSPARENT : Style.button().borderColor,
            background: opts.ghost ? TRANSPARENT : Style.button().backgroundColor,
            textColor: Style.button().textColor,
        },
        hoverStyle: opts.hoverStyle || {
            background: Style.button().hoverBackgroundColor,
            borderColor: Style.button().borderColor,
            textColor: Style.button().textColor,
        },
        borderWidth: opts.ghost ? Style.button().borderWidth : opts.borderWidth || Style.button().borderWidth,
        borderRadius: opts.borderRadius || Style.button().borderRadius,
        children: [
            new IconElement({icon: opts.icon, shadow:true}),
            new TextElement({
                padding: ZERO_INSETS,
                font: Style.button().font,
                margin: ZERO_INSETS,
                visualStyle:{
                    borderColor: TRANSPARENT,
                    background: TRANSPARENT,
                    textColor: Style.button().textColor
                },
                borderWidth: ZERO_INSETS,
                text: opts.text || "",
                shadow: true,
            }),
        ],
        crossAxisLayout: "center",
        crossAxisSelfLayout: "shrink",
        mainAxisLayout: "center",
        mainAxisSelfLayout: "shrink",
        margin: Style.button().margin,
        padding: Style.button().padding,
        handleEvent: opts.handleEvent,
    })
}

const NULL_HOVER:VisualStyle = {
    borderColor:TRANSPARENT,
}
export const CheckBox = (p: ButtonParameters) => IconButton({
    icon: p.selected?Icons.CheckboxChecked:Icons.CheckboxUnchecked,
    hoverStyle: NULL_HOVER,
    ghost:true, ...p
})
export const RadioButton = (p: ButtonParameters) => IconButton({
    icon: p.selected?Icons.RadioButtonUnchecked:Icons.RadioButtonChecked,
    hoverStyle: NULL_HOVER,
    ghost:true, ...p
})

export const Button = (opts: ButtonParameters) => {
    return new MHBoxElement({
        key:opts.key,
        kind:'button',
        visualStyle: {
            background: opts.selected?Style.selectedButton().backgroundColor:Style.button().backgroundColor,
            borderColor: opts.borderColor || Style.button().borderColor,
            textColor: Style.button().textColor,
        },
        hoverStyle: {
            background:opts.selected?Style.selectedButton().hoverBackgroundColor:Style.button().hoverBackgroundColor,
            borderColor: Style.button().borderColor,
            textColor: Style.button().textColor,
        },
        borderWidth: opts.borderWidth || Style.button().borderWidth,
        borderRadius: opts.borderRadius || Style.button().borderRadius,
        children: [new TextElement({
            padding: ZERO_INSETS,
            font: Style.button().font,
            fontSize: Style.button().fontSize,
            fontWeight: Style.button().fontWeight,
            margin: ZERO_INSETS,
            visualStyle:{
                borderColor: TRANSPARENT,
                background: TRANSPARENT,
                textColor: Style.button().textColor,
            },
            borderWidth: ZERO_INSETS,
            text: opts.text || "",
            shadow: true,
        })],
        crossAxisLayout: 'center',
        crossAxisSelfLayout: 'shrink',
        mainAxisLayout: 'center',
        mainAxisSelfLayout: 'shrink',
        margin: opts.margin||Style.button().margin,
        padding: opts.padding || Style.button().padding,
        handleEvent: opts.handleEvent,
    })
}

export function Tag(opts: { text: string }) {
    return new MHBoxElement({
        visualStyle: {
            background: 'blue',
            borderColor: Style.button().borderColor,
            textColor: Style.button().textColor,
        },
        borderWidth: Style.button().borderWidth,
        borderRadius: Style.button().borderRadius,
        children: [new TextElement({
            padding: ZERO_INSETS,
            font: Style.button().font,
            margin: ZERO_INSETS,
            visualStyle: {
                borderColor: 'transparent',
                background: TRANSPARENT,
                textColor: Style.button().textColor,
            },
            borderWidth: ZERO_INSETS,
            text: opts.text,
            shadow: true,
        })],
        crossAxisLayout: 'center',
        crossAxisSelfLayout: 'shrink',
        mainAxisLayout: 'center',
        mainAxisSelfLayout: 'shrink',
        margin: Style.button().margin,
        padding: Style.button().padding,
    })
}

class DropdownButtonElement implements GElement {
    private props: { children: GElement[]; text: string };

    constructor(props: { children: GElement[]; text: string }) {
        this.props = props
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        let key = KEY_VENDOR.getKey()
        const cache: StateCache = MGlobals.get(STATE_CACHE)
        const state = cache.getState(key)
        let [open, setOpen] = state.useState("open", () => false)
        let button = IconButton({
            text: this.props.text, icon: Icons.KeyboardArrowDown, handleEvent: (e) => {
                if (e.type === 'mouse-down') {
                    setOpen(!open)
                    e.redraw()
                }
            }
        })
        const popup = new PopupContainer({
            child: VBox({
                kind: 'popup-menu',
                mainAxisSelfLayout: 'shrink',
                crossAxisLayout: 'center',
                children: this.props.children,
                borderWidth: withInsets(10),
                visualStyle: {
                    background: 'red',
                    borderColor: 'green',
                    textColor: 'black',
                },
            })
        })
        if (open) {
            let hbox = HBox({
                kind: 'dropdown-button',
                mainAxisSelfLayout: 'shrink',
                children: [button, popup]
            })
            let hbox_node = hbox.layout(rc, cons)
            hbox_node.settings.key = key
            return hbox_node
        } else {
            let hbox = HBox({
                kind: 'dropdown-button',
                mainAxisSelfLayout: 'shrink',
                children: [button]
            })
            let hbox_node = hbox.layout(rc, cons)
            hbox_node.settings.key = key
            return hbox_node
        }
    }
}

export function DropdownButton(props: { children: GElement[]; text: string }) {
    return new DropdownButtonElement(props)
}


export type ToggleButtonOptions = {
    selected?: StateHandler<boolean>
    text:string
}

export function ToggleButton(opts: ToggleButtonOptions) {
    const key = KEY_VENDOR.getKey()
    let [selected, setSelected] = useState(key,"selected",opts.selected,()=>false)
    return Button({
        text: opts.text,
        selected: selected,
        handleEvent: (e) => {
            if (e.type === 'mouse-down') {
                setSelected(!selected)
                e.redraw()
            }
        }
    })
}

export type ToggleGroupParameters<T> = {
    key?: string,
    // @ts-ignore
    data: T[] | ObjList<T>
    selected?: StateHandler<number>
}

export function ToggleGroup<T>(opts: ToggleGroupParameters<T>) {
    const key = KEY_VENDOR.getKey()
    let [selected, setSelected] = useState(key, "selected", opts.selected, () => 0)
    return HBox({
        borderWidth: withInsets(1),
        mainAxisSelfLayout: 'shrink',
        borderColor: Style.base().borderColor,
        children: opts.data.map((ch, i) => {
            let bdr = new Insets(0, 0, 0, 1)
            return Button({
                text: ch + "", borderWidth: bdr,
                borderRadius: ZERO_INSETS,
                margin: ZERO_INSETS,
                selected: i === selected,
                handleEvent: (e) => {
                    if (e.type === 'mouse-down') {
                        setSelected(i)
                        e.redraw()
                    }
                }
            })
        })
    })
}
