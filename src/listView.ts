import {AxisLayout, CEvent, EventHandler, GElement, MGlobals} from "./base.ts";
import {MHBoxElement, MVBoxElement} from "./layout.ts";
import {Style} from "./style.ts";
import {withInsets} from "./gfx.ts";
import {Label} from "./text.ts";
import {STATE_CACHE, StateCache} from "./state.ts";

type ListViewItemParameters = {
    children:GElement[],
    selected: boolean
    handleEvent: EventHandler
    mainAxisLayout?: AxisLayout
}

export function ListViewItem(opts: ListViewItemParameters): GElement {
    return new MHBoxElement({
        id: 'ListViewItem',
        mainAxisSelfLayout: 'grow',
        crossAxisSelfLayout: 'shrink',
        mainAxisLayout: opts.mainAxisLayout || 'start',
        crossAxisLayout: 'center',
        visualStyle:{
            background: opts.selected ? Style.selectedBackgroundColor : Style.panelBackgroundColor,
            textColor: Style.textColor,
            borderColor: Style.panelBorderColor,
        },
        hoverStyle: {
            background: opts.selected ? Style.selectedBackgroundHoverColor : Style.selectedBackgroundHoverColor,
        },
        children: opts.children,
        handleEvent: opts.handleEvent,
    })
}


export type OnSelectedChangedCallback = (i: number, e: CEvent) => void;

export type ListItemRenderer = (item:string,
                         selected:number,
                         index:number,
                         onSelectedChanged:OnSelectedChangedCallback
                         ) => GElement

export type ListViewParameters = {
    key?:string,
    data: string[]
    selected?: number
    onSelectedChanged?:OnSelectedChangedCallback
    renderItem?:ListItemRenderer
}

const DefaultItemRenderer:ListItemRenderer = (item:string,selected:number,index:number, onSelectedChanged   ) => {
    return ListViewItem({
        // text:item,
        children: [
            Label({text: item, shadow: true}),
        // Label({text: opts.text, shadow: true}),
        ],
        selected: index === selected,
        handleEvent: (e) => onSelectedChanged(index, e)
    })
}

export function ListView(opts: ListViewParameters): GElement {
    const cache:StateCache =  MGlobals.get(STATE_CACHE);
    if(!opts.key) {
        console.warn("list view without a key")
        throw new Error("list view without a key")
    }
    cache.startElement(opts.key)

    const [selected, setSelected] = cache.useState("selected",()=>0)
    const renderer = opts.renderItem || DefaultItemRenderer
    let box = new MVBoxElement({
        mainAxisSelfLayout: 'shrink',
        crossAxisSelfLayout: 'shrink',
        id: 'list-view',
        visualStyle: {
            borderColor: Style.panelBorderColor,
            textColor: Style.textColor,
            background: Style.panelBackgroundColor
        },
        borderWidth: withInsets(1),
        children: opts.data.map((item, index) => {
            return renderer(item, selected, index, (s,e) => {
                setSelected(s)
                e.redraw()
                // if(opts.onSelectedChanged) opts.onSelectedChanged(s,e)
            })
        })
    })
    cache.endElement(opts.key)
    return box
}
