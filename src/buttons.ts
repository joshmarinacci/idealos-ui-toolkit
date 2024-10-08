import {IconElement, Icons} from "./icons.js";
import {
    ElementSettings,
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
import {RenderContext} from "./gfx.js";
import {KEY_VENDOR} from "./keys.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {PopupContainer} from "./popup.js";
import {ObjList} from "rtds-core";

type ButtonParameters = {
    text?:string
    selected?:boolean
} & Partial<ElementSettings>
type IconButtonRequired = {
    icon: Icons
    ghost?: boolean
} & ButtonParameters;

export function IconButton(opts: IconButtonRequired) {
    return new MHBoxElement({
        kind:IconButton.name,
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
            new IconElement({
                fontSize: opts.fontSettings?.fontSize,
                icon: opts.icon, shadow:true,
            }),
            new TextElement({
                padding: ZERO_INSETS,
                fontSettings: opts.fontSettings || {
                    font: Style.button().font,
                    fontSize: Style.button().fontSize,
                    fontWeight: Style.button().fontWeight,
                },
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
        padding:  opts.padding || Style.button().padding,
        handleEvent: opts.handleEvent,
    })
}

const NULL_HOVER:VisualStyle = {
    borderColor:TRANSPARENT,
}
export const Button = (opts: ButtonParameters) => {
    let bg = opts.visualStyle?.background || Style.button().backgroundColor;
    return new MHBoxElement({
        key:opts.key,
        kind:'button',
        visualStyle: {
            background: opts.selected?Style.selectedButton().backgroundColor:bg,
            borderColor: opts.visualStyle?.borderColor || Style.button().borderColor,
            textColor: Style.button().textColor,
        },
        hoverStyle: opts.hoverStyle || {
            background:opts.selected?Style.selectedButton().hoverBackgroundColor:Style.button().hoverBackgroundColor,
            borderColor: Style.button().borderColor,
            textColor: Style.button().textColor,
        },
        borderWidth: opts.borderWidth || Style.button().borderWidth,
        borderRadius: opts.borderRadius || Style.button().borderRadius,
        children: [new TextElement({
            padding: Insets.from(1),
            fontSettings: opts.fontSettings || {
                font: Style.button().font,
                fontSize: Style.button().fontSize,
                fontWeight: Style.button().fontWeight,
            },
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
        padding: opts.padding || Style.button().padding,
        handleEvent: opts.handleEvent,
    })
}

export function Tag(opts: { text: string }) {
    return new MHBoxElement({
        kind:Tag.name,
        visualStyle: {
            background: 'cyan',
            borderColor: Style.button().borderColor,
            textColor: Style.button().textColor,
        },
        borderWidth: Style.button().borderWidth,
        borderRadius: Insets.from(Style.button().fontSize),
        children: [new TextElement({
            padding: ZERO_INSETS,
            fontSettings: {
                font: Style.button().font,
                fontSize: Style.button().fontSize,
                fontWeight: Style.button().fontWeight,
            },
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

            text: this.props.text,
            icon: Icons.KeyboardArrowDown,
            handleEvent: (e) => {
                if (e.type === 'mouse-down') {
                    setOpen(!open)
                    e.redraw()
                }
            },
        })
        const popup = new PopupContainer({
            child: VBox({
                crossAxisSelfLayout: undefined,
                mainAxisLayout: undefined,
                visualStyle: undefined,
                kind: 'popup-menu',
                mainAxisSelfLayout: 'shrink',
                crossAxisLayout: 'center',
                children: this.props.children,
                borderWidth: Insets.from(10),
            })
        })
        if (open) {
            let hbox = HBox({
                kind: 'dropdown-button',
                mainAxisSelfLayout: 'shrink',
                children: [button, popup],
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

export type ToggleIconButtonOptions = {
    selectedIcon:Icons,
    unselectedIcon:Icons
} & ToggleButtonOptions

export function ToggleIconButton(opts: ToggleIconButtonOptions) {
    const key = KEY_VENDOR.getKey()
    let [selected, setSelected] = useState(key,"selected",opts.selected,()=>false)
    return IconButton({
        icon: selected?opts.selectedIcon:opts.unselectedIcon,
        hoverStyle: NULL_HOVER,
        text: opts.text,
        ghost:true,
        handleEvent: (e) => {
            if (e.type === 'mouse-down') {
                setSelected(!selected)
                e.redraw()
            }
        }
    })
}

export const CheckBox = (opts: ToggleButtonOptions) => {
    return ToggleIconButton({
        ...opts,
        unselectedIcon: Icons.CheckboxUnchecked,
        selectedIcon: Icons.CheckboxChecked
    })
}
export const RadioButton = (opts: ToggleButtonOptions) => {
    return ToggleIconButton({
        ...opts,
        unselectedIcon: Icons.RadioButtonUnchecked,
        selectedIcon: Icons.RadioButtonChecked,
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
        borderWidth: Insets.from(1),
        visualStyle: {
            borderColor: Style.button().borderColor,
        },
        mainAxisSelfLayout: 'shrink',
        children: opts.data.map((ch, i) => {
            let bdr = new Insets(0, 0, 0, 1)
            return Button({
                text: ch + "", borderWidth: bdr,
                borderRadius: ZERO_INSETS,
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
