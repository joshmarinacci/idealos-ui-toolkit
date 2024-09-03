import {AxisLayout, CEvent, EventHandler, GElement, StateHandler, useState} from "./base.js";
import {MHBoxElement, MVBoxElement} from "./layout.js";
import {Style} from "./style.js";
import {withInsets} from "./gfx.js";
import {Label} from "./text.js";
import {KEY_VENDOR} from "./keys.js";
import {ObjList} from "rtds-core";
import {Insets} from "josh_js_util";

type ListViewItemParameters = {
    children:GElement[],
    selected: boolean
    handleEvent: EventHandler
    mainAxisLayout?: AxisLayout
    padding?:Insets
}

export function ListViewItem(opts: ListViewItemParameters): GElement {
    return new MHBoxElement({
        kind: 'ListViewItem',
        mainAxisSelfLayout: 'grow',
        crossAxisSelfLayout: 'shrink',
        mainAxisLayout: opts.mainAxisLayout || 'start',
        crossAxisLayout: 'center',
        borderWidth: new Insets(0,0,1,0),
        padding: opts.padding || Style.panel().padding,
        visualStyle:{
            background: opts.selected ? Style.selectedButton().backgroundColor : Style.panel().backgroundColor,
            textColor: Style.base().textColor,
            borderColor:'black'
        },
        hoverStyle: {
            background: opts.selected ? Style.selectedButton().hoverBackgroundColor : Style.button().hoverBackgroundColor
        },
        children: opts.children,
        handleEvent: opts.handleEvent,
    })
}


export type OnSelectedChangedCallback = (i: number, e: CEvent) => void;

export type ListItemRenderer<T> = (item:T,
                         selected:number,
                         index:number,
                         onSelectedChanged:OnSelectedChangedCallback
                         ) => GElement

export type ListViewParameters<T> = {
    key?:string,
    // @ts-ignore
    data: T[] | ObjList<T>
    selected?: StateHandler<number>
    renderItem?:ListItemRenderer<T>
}

const DefaultItemRenderer:ListItemRenderer<unknown> = (item:unknown,selected:number,index:number, onSelectedChanged   ) => {
    return ListViewItem({
        // text:item,
        children: [
            Label({text: (item+""), shadow: true}),
        // Label({text: opts.text, shadow: true}),
        ],
        selected: index === selected,
        handleEvent: (e) => {
            if(e.type === 'mouse-down') onSelectedChanged(index, e)
        }
    })
}

export function ListView<T>(opts: ListViewParameters<T>): GElement {
    const key = KEY_VENDOR.getKey()
    let [selected, setSelected] = useState<number>(key,"selected",opts.selected,()=>0)
    const renderer = opts.renderItem || DefaultItemRenderer
    // console.log("doing layout",key)
    const navUp = (e:CEvent) => {
        console.log("nav up", selected, e.type)
        if(selected > 0) {
            setSelected(selected - 1)
        }
        e.use()
        e.redraw()
    }
    const navDown = (e:CEvent) => {
        console.log("nav down", selected, e.type)
        setSelected(selected+1)
        e.use()
        e.redraw()
    }
    const navTo = (s:number,e:CEvent) => {
        console.log("nav to", selected, e.type)
        setSelected(s)
        e.use()
        e.redraw()
    }
    return new MVBoxElement({
        mainAxisSelfLayout: 'shrink',
        crossAxisSelfLayout: 'shrink',
        kind: 'list-view',
        key: key,
        visualStyle: {
            borderColor: Style.panel().borderColor,
            textColor: Style.base().textColor,
            background: Style.panel().backgroundColor
        },
        borderWidth: withInsets(1),
        handleEvent:(e) => {
            if(e.type === 'keyboard-typed') {
                if(e.key === 'ArrowUp') return navUp(e)
                if(e.key === 'ArrowDown') return navDown(e)
            }
        },
        children: opts.data.map((item, index) => {
            return renderer(item, selected, index, (s, e) => navTo(s, e))
        })
    })
}
