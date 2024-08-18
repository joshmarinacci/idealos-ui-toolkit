import {CEvent, EventHandler, GElement} from "./base.ts";
import {MHBoxElement, MVBoxElement} from "./layout.ts";
import {Style} from "./style.ts";
import {Label} from "./comps2.ts";
import {withInsets} from "./gfx.ts";

type ListViewItemParameters = {
    text: string
    selected: boolean
    handleEvent: EventHandler
}

function ListViewItem(opts: ListViewItemParameters): GElement {
    return new MHBoxElement({
        id: 'ListViewItem',
        mainAxisSelfLayout: 'grow',
        crossAxisSelfLayout: 'shrink',
        mainAxisLayout: 'start',
        crossAxisLayout: 'center',
        visualStyle:{
            background: opts.selected ? Style.selectedBackgroundColor : Style.panelBackgroundColor,
            textColor: Style.textColor,
            borderColor: Style.panelBorderColor,
        },
        hoverStyle: {
            background: opts.selected ? Style.selectedBackgroundHoverColor : Style.selectedBackgroundHoverColor,
        },
        children: [
            Label({text: opts.text, shadow: true}),
            // Label({text: opts.text, shadow: true}),
        ],
        handleEvent: opts.handleEvent,
    })
}

type ListViewParameters = {
    data: string[]
    selected: number,
    onSelectedChanged(i: number, e: CEvent): void;
}

export function ListView(opts: ListViewParameters): GElement {
    return new MVBoxElement({
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
            return ListViewItem({
                text: item,
                selected: opts.selected === index,
                handleEvent: (e) => opts.onSelectedChanged(index, e)
            })
        })
    })
}
