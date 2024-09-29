import {useState} from '../base.js'
import {HBox, HSpacer, VBox} from '../layout.js'
import {KEY_VENDOR} from "../keys.js";
import {Button} from "../buttons.js";
import {ListItemRenderer, ListView, ListViewItem} from "../listView.js";
import {Label} from "../text.js";
import {Contact, CONTACTS} from "./model.js";
import {Insets} from "josh_js_util";
import {Icon, Icons} from "../icons.js";
import {AtomAsState, atomAsStateHandler} from "../util.js";
import {Schema} from "rtds-core";
/*
const contactToString: StringRenderer<ContactType> = (val: ContactType) => `${val.get('last')}, ${val.get('first')}`

const contactFieldRenderer: ObjectItemRenderer<ContactType, any> = (item: ContactType, subItem: any, name: string, i) => {
    const key = `${name}_${i}`
    if (name === 'last') return <Fragment key={key}></Fragment>
    if (name === 'first')
        return (
            <Row key={key} data-name={key}>
                <label>name</label>
                {item.get('first').get()} {item.get('last').get()}
            </Row>
        )
    if (name === 'age')
        return (
            <Row key={key} data-name={key}>
                <label>age</label>
                <b>{item.get('age').get().toString()}</b>
            </Row>
        )
    if (name === 'company' && (subItem as ObjAtom<string>).get() === '') return <Fragment key={key}></Fragment>
    if (name === 'email') {
        const email: typeof EmailAddress = subItem
        return (
            <Row key={key} data-name={key}>
                <label>{email.get('type').toString()}</label>
                <b>{email.get('address').toString()}</b>
            </Row>
        )
    }
    if (name === 'phone') {
        const phone: typeof PhoneNumber = subItem
        return (
            <Row key={key} data-name={key}>
                <label>{phone.get('type').toString()}</label>
                <b>{phone.get('number').toString()}</b>
            </Row>
        )
    }

    return (
        <Row key={key} data-name={key}>
            <label>{name}</label> <b>{subItem ? subItem.toString() : 'empty'}</b>
        </Row>
    )
}
*/

const S = new Schema()
const AppState = S.map({
    contacts: CONTACTS,
    selected: S.number(0)
})

const ContactRenderer: ListItemRenderer<typeof Contact> = (item, selected, index, onSelectedChanged) => {
    return ListViewItem({
        selected: index == selected,
        padding: Insets.from(8),
        mainAxisLayout: 'between',
        handleEvent: (e) => {
            if (e.type === 'mouse-down') {
                onSelectedChanged(index, e)
            }
        },
        children: [
            Label({
                text: item.get('last').get()
                    + ", " + item.get('first').get()
                , shadow: true
            }),
        ]
    })
}

function ContactPanel(opts: { contact: typeof Contact }) {
    const con = opts.contact
    return VBox({
        children: [
            HBox({
                fixedWidth: 300,
                children: [
                    Label({text: `${con.get('first').get()} ${con.get('last').get()}`}),
                ]
            }),
            Label({text:`age: ${con.get('age').get()}`}),
            VBox({
                children: con.get('phone').map(p => {
                    console.log("phone",p)
                        return Label({
                            text:'type: '
                                + p.get('type').get()
                                + ' '
                                + p.get('number').get()
                        })
                    })
            })
        ]
    })

}

export function ContactsApp() {
    const key = KEY_VENDOR.getKey()
    const add = () => {
        const contact = Contact.cloneWith({first: 'first', last: 'last'})
        console.log("made a contact", contact)
        // setSelected(contact)
    }
    return VBox({
        children: [
            HBox({
                children: [
                    Button({
                        text: 'add', handleEvent: (e) => {
                            if (e.type === 'mouse-down') {
                                add()
                            }
                        }
                    }),
                    Button({text: 'edit'}),
                ]
            }),
            HBox({
                fixedWidth: 200,
                mainAxisSelfLayout: 'shrink',
                children: [
                    ListView({
                        fixedWidth: 200,
                        data: CONTACTS,
                        renderItem: ContactRenderer,
                        selected: atomAsStateHandler(AppState.get('selected')),
                    }),
                    ContactPanel({
                        contact: AppState.get('contacts').get(AppState.get('selected').get()),
                    }),
                ]
            })
        ]
    })
}
