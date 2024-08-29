import {ObjAtom, Schema} from 'rtds-core'
import {Button, CheckBox} from "./buttons.js";
import {HBox, VBox} from "./layout.js";
import {ListItemRenderer, ListView, ListViewItem} from "./listView.js";
import {Label} from "./text.js";
import {CEvent, StateHandler} from "./base.js";

const S = new Schema()
const TodoItem = S.map(
    {
        title: S.string('', { typeName: 'title' }),
        completed: S.boolean(false, { typeName: 'completed' }),
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
        title:'first',
    },
    {
        title:'second',
    }
])

data.on('changed', () => {
    console.log("data has changed")
})

function AtomAsState<T>(atom:ObjAtom<T>):StateHandler<T> {
    return {
        get:() => atom.get(),
        set:(v) => {
            atom.set(v)
        }
    }
}

const RenderListItem:ListItemRenderer<typeof TodoItem> = (item:typeof TodoItem, selected, index, onSelectedChanged) => {
    return ListViewItem({
        children:[
            CheckBox({text:"",selected: AtomAsState(item.get('completed'))}),
            Label({text:item.get('title').get()}),
        ],
        selected: selected == index,
        mainAxisLayout: 'start',
        handleEvent: (e) => {
            if(e.type === 'mouse-down') onSelectedChanged(index, e)
        }
    })
}


export function TodoListDemo() {
    const addItem = (e:CEvent) => {
        if(e.type === 'mouse-down') {
            const item = TodoItem.cloneWith({
                title: "next item",
                completed: false
            })
            data.push(item)
        }
    }
    const deleteItem = (e:CEvent) => {
        if(e.type === 'mouse-down') {
            data.deleteAt(0)
        }
    }
    return VBox({children:[
            HBox({children:[
                    Button({text:"Add", handleEvent:addItem}),
                    Button({text:"Delete", handleEvent:deleteItem}),
            ]}),
            ListView({
                data: data,
                renderItem:RenderListItem
            })
    ]})
}
