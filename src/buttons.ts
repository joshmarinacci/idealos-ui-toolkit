import {IconElement, Icons} from "./icons.ts";
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
} from "./base.ts";
import {HBox, MHBoxElement, VBox} from "./layout.ts";
import {Style} from "./style.ts";
import {Insets} from "josh_js_util";
import {TextElement} from "./text.ts";
import {RenderContext, withInsets} from "./gfx.ts";
import {KEY_VENDOR} from "./keys.ts";
import {STATE_CACHE, StateCache} from "./state.ts";
import {PopupContainer} from "./demo/popup.ts";

type ButtonParameters = {
    margin?:Insets,
    borderWidth?: Insets
    padding?:Insets,
    text?:string,
    selected?:boolean
    handleEvent?: EventHandler
    borderRadius?: Insets
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
            borderColor:opts.ghost ? TRANSPARENT : Style.buttonBorderColor,
            background: opts.ghost ? TRANSPARENT : Style.buttonBackground,
            textColor: Style.buttonTextColor,
        },
        hoverStyle: opts.hoverStyle || {
            background: Style.buttonBackgroundHoverColor,
            borderColor: Style.buttonBorderColor,
            textColor: Style.buttonTextColor,
        },
        borderWidth: opts.ghost ? Style.buttonBorderWidth : opts.borderWidth || Style.buttonBorderWidth,
        borderRadius: opts.borderRadius || Style.buttonBorderRadius,
        children: [
            new IconElement({icon: opts.icon, shadow:true}),
            new TextElement({
                padding: ZERO_INSETS,
                font: Style.font,
                margin: ZERO_INSETS,
                visualStyle:{
                    borderColor: TRANSPARENT,
                    background: TRANSPARENT,
                    textColor: Style.buttonTextColor,
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
        margin: Style.buttonMargin,
        padding: Style.buttonPadding,
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
            background: opts.selected?Style.selectedBackgroundColor:Style.buttonBackground,
            borderColor: Style.buttonBorderColor,
            textColor: Style.buttonTextColor,
        },
        hoverStyle: {
            background:opts.selected?Style.selectedBackgroundHoverColor:Style.buttonBackgroundHoverColor,
            borderColor: Style.buttonBorderColor,
            textColor: Style.buttonTextColor,
        },
        borderWidth: opts.borderWidth || Style.buttonBorderWidth,
        borderRadius: opts.borderRadius || Style.buttonBorderRadius,
        children: [new TextElement({
            padding: ZERO_INSETS,
            font: Style.font,
            margin: ZERO_INSETS,
            visualStyle:{
                borderColor: TRANSPARENT,
                background: TRANSPARENT,
                textColor: Style.buttonTextColor,
            },
            borderWidth: ZERO_INSETS,
            text: opts.text || "",
            shadow: true,
        })],
        crossAxisLayout: 'center',
        crossAxisSelfLayout: 'shrink',
        mainAxisLayout: 'center',
        mainAxisSelfLayout: 'shrink',
        margin: opts.margin||Style.buttonMargin,
        padding: opts.padding || Style.buttonPadding,
        handleEvent: opts.handleEvent,
    })
}

export function Tag(opts: { text: string }) {
    return new MHBoxElement({
        visualStyle: {
            background: 'blue',
            borderColor: Style.buttonBorderColor,
            textColor: Style.textColor,
        },
        borderWidth: Style.buttonBorderWidth,
        borderRadius: Style.tagBorderRadius,
        children: [new TextElement({
            padding: ZERO_INSETS,
            font: Style.font,
            margin: ZERO_INSETS,
            visualStyle: {
                borderColor: 'transparent',
                background: TRANSPARENT,
                textColor: Style.buttonTextColor,
            },
            borderWidth: ZERO_INSETS,
            text: opts.text,
            shadow: true,
        })],
        crossAxisLayout: 'center',
        crossAxisSelfLayout: 'shrink',
        mainAxisLayout: 'center',
        mainAxisSelfLayout: 'shrink',
        margin: Style.buttonMargin,
        padding: Style.buttonPadding,
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
