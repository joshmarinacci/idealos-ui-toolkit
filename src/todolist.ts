import {Schema} from 'rtds-core'
import {Button, CheckBox} from "./buttons.js";
import {HBox, VBox} from "./layout.js";
import {ListItemRenderer, ListView, ListViewItem} from "./listView.js";
import {Label} from "./text.js";
import {CEvent} from "./base.js";
import {KEY_VENDOR} from "./keys.js";
import {AtomAsState, useRefresh} from "./util.js";

const S = new Schema()
const TodoItem = S.map(
    {
        title: S.string('', {typeName: 'title'}),
        completed: S.boolean(false, {typeName: 'completed'}),
        deleted: S.boolean(false),
        archived: S.boolean(false),
    },
    {
        typeName: 'TodoItem',
    }
)

const TodoList = S.list(TodoItem)


const data = TodoList.cloneWith([
    {
        // @ts-ignore
        title: 'first',
    },
    {
        // @ts-ignore
        title: 'second',
    }
])

data.on('changed', () => {
    console.log("data has changed")
})

const RenderListItem: ListItemRenderer<typeof TodoItem> = (item: typeof TodoItem, selected, index, onSelectedChanged) => {
    return ListViewItem({
        children: [
            CheckBox({text: "", selected: AtomAsState(item.get('completed'))}),
            Label({text: item.get('title').get()}),
        ],
        selected: selected == index,
        mainAxisLayout: 'start',
        handleEvent: (e) => {
            if (e.type === 'mouse-down') onSelectedChanged(index, e)
        }
    })
}

const state = {
    data: data,
    selected: S.number()
}

export function makeTodolistDemo() {
    const key = KEY_VENDOR.getKey()
    useRefresh(key,data)
    const addItem = (e: CEvent) => {
        if (e.type != 'mouse-down') return
        const item = TodoItem.cloneWith({
            title: "next item",
            completed: false
        })
        data.push(item)
    }
    const deleteItem = (e: CEvent) => {
        if (e.type !== 'mouse-down') return
        data.deleteAt(state.selected.get())
    }
    return VBox({
        key:key,
        children: [
            HBox({
                children: [
                    Button({text: "Add", handleEvent: addItem}),
                    Button({text: "Delete", handleEvent: deleteItem}),
                ]
            }),
            ListView({
                data: data,
                renderItem: RenderListItem,
                selected: AtomAsState(state.selected),
            })
        ]
    })
}
