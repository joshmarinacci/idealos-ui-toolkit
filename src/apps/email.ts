import {HBox, HSpacer, VBox} from "../layout.js";
import {ScrollContainer} from "../scroll.js";
import {ListItemRenderer, ListView, ListViewItem} from "../listView.js";
import {Button, DropdownButton, IconButton, ToggleGroup} from "../buttons.js";
import {Label, WrappingLabel} from "../text.js";
import {Icon, Icons} from "../icons.js";
import {ObjAtom, Schema} from "rtds-core"
import {CEvent, StateHandler} from "../base.js";
import {GridBox} from "../gridbox.js"

import {Insets} from "josh_js_util";


const S = new Schema()

// @ts-ignore
const EmailAccount = S.enum(['Work', 'home'], 'home')
// @ts-ignore
const emailAccount = EmailAccount.cloneWith('Work')
const Folder = S.map({
    name: S.string(),
    count: S.number(),
    icon: S.string(),
}, {typeName: "Folder"})
type EmailFolder = typeof Folder
const Folders = S.list(Folder)
const email_folders = Folders.cloneWith([
// @ts-ignore
    {name: "Inbox", count: 128, icon: Icons.Inbox},
// @ts-ignore
    {name: 'Drafts', count: 9, icon: Icons.Draft},
// @ts-ignore
    {name: 'Sent', count: -1, icon: Icons.Send},
// @ts-ignore
    {name: 'Junk', count: 23, icon: Icons.Delete},
// @ts-ignore
    {name: 'Trash', count: -1, icon: Icons.Delete},
// @ts-ignore
    {name: 'Archive', count: -1, icon: Icons.Archive},
// @ts-ignore
    {name: 'Social', count: 972, icon: Icons.Group},
// @ts-ignore
    {name: 'Updates', count: 342, icon: Icons.Info},
// @ts-ignore
    {name: 'Forums', count: 128, icon: Icons.Forum},
// @ts-ignore
    {name: 'Shopping', count: 8, icon: Icons.ShoppingCart},
])
const EmailMessage = S.map({
    sender: S.string(),
    subject: S.string(),
    date: S.jsobj(Date),
    body: S.string(),
    tags: S.list(S.string()),
    unread: S.boolean()
})
const Messages = S.list(EmailMessage)
const messages = Messages.cloneWith([
    {
// @ts-ignore
        sender: "Emily Davis",
        subject: "Re: Question about Budget",
        date: Date.now(),
        body: "I have a question about the budget for the upcoming project.",
        tags: ["work", "budget"],
        unread: true,
    },
    {
// @ts-ignore
        sender: "Michael Wilson",
        subject: "Important Annoucnement",
        date: Date.now(),
        body: "I have an important announcement to make during our team meeting. It pertains to a strategic shift in our approach",
        unread: true,
        tags: ['meeting', 'work', 'important'],
    }
])
// @ts-ignore
const InboxFilter = S.enum(["All mail", "Unread"], "Unread")
// @ts-ignore
const filter = InboxFilter.cloneWith("Unread")


const AppState = S.map({
    search: S.string(),
    email_folders: email_folders,
    selectedFolder: S.number(),
    messages: messages,
    selectedMessage: S.number()
})

const onMouseDown = (cb: (e: CEvent) => void) => {
    return (e: CEvent) => {
        if (e.type === 'mouse-down') {
            cb(e)
        }
    }
}
const EmailMessRenderer: ListItemRenderer<typeof EmailMessage> = (item, selected, index, onSelectedChanged) => {
    return ListViewItem({
        selected: index === selected,
        padding: Insets.from(0),
        mainAxisLayout: 'start',
        handleEvent: onMouseDown((e) => onSelectedChanged(index, e)),
        children: [
            VBox({
                shadow: true,
                mainAxisSelfLayout: 'shrink',
                crossAxisSelfLayout:'grow',
                padding: Insets.from(4),
                visualStyle: {
                    background: index == selected ? 'orange' : 'white',
                },
                children: [
                    Label({text: item.get('sender').get(), shadow: true, bold: true}),
                    WrappingLabel({
                        text: item.get('subject').get(),
                        shadow: true
                    }),
                    WrappingLabel({text: item.get('body').get().substring(0, 100) + '...', shadow: true})
                ]
            }),
        ],
    })
}
const EmailFolderRenderer: ListItemRenderer<EmailFolder> = (item, selected, index, onSelectedChanged) => {
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
            Icon({icon: item.get('icon').get() as Icons}),
            Label({text: item.get('name').get(), shadow: true}),
            HSpacer(),
            Label({text: item.get('count').get() + "", shadow: true}),
        ]
    })
}

const EmailHeaderView = (mess: typeof EmailMessage) => {
    return HBox({
        children: [
            Label({text: mess.get('sender').get(), bold:true}),
            Label({text: mess.get('subject').get()}),
        ]
    })
}

function EmailBody(selectedMessage: typeof EmailMessage) {
    return ScrollContainer({
        fixedHeight: 300,
        child: WrappingLabel({
        text: selectedMessage.get('body').get(),
    })})
}

function atomAsStateHandler<T>(atom: ObjAtom<T>) {
    const hand: StateHandler<T> = {
        get: () => atom.get(),
        set: (v: T) => atom.set(v)
    }
    return hand
}

export function EmailDemo() {
    return GridBox({
        mainAxisSelfLayout:'grow',
        crossAxisSelfLayout:'grow',
        columns:[
            {
                fixedWidth:200,
            },
            {
                fixedWidth:250,
            },
            {
            }
        ],
        rows: [
            {
                fixedHeight: 50,
            },
            {
            }
        ],
        children: [
            DropdownButton({
                text: "Work", children: [
                    Button({text: "Work"}),
                    Button({text: "Personal"}),
                ]
            }),
            HBox({
                mainAxisSelfLayout: 'shrink',
                children: [
                    Label({text: "Inbox"}),
                    ToggleGroup({
                        data:["All Mail", "Unread"]
                    }),
                ]
            }),
            HBox({
                children: [
                    IconButton({icon: Icons.Archive, ghost: true}),
                    IconButton({icon: Icons.DeleteForever, ghost: true}),
                    IconButton({icon: Icons.Delete, ghost: true}),
                    // HSep(),
                    // IconButton({icon: Icons.Snooze, ghost: true}),
                    IconButton({icon: Icons.Reply, ghost: true}),
                    // IconButton({icon: Icons.ReplyAll, ghost: true}),
                    IconButton({icon: Icons.Forward, ghost: true}),
                    // HSep()
                    // IconButton({icon: Icons.LeftPanelCloseIcon, ghost: true}),
                ]
            }),
            ScrollContainer({
                child: ListView({
                    data: AppState.get('email_folders'),
                    selected: atomAsStateHandler(AppState.get('selectedFolder')),
                    renderItem: EmailFolderRenderer,
                })
            }),
            ScrollContainer({
                child: ListView({
                    mainAxisSelfLayout:'grow',
                    data: messages,
                    selected:atomAsStateHandler(AppState.get('selectedMessage')),
                    renderItem: EmailMessRenderer,
                })
            }),
            VBox({
                crossAxisSelfLayout: 'shrink',
                children: [
                    EmailHeaderView(AppState.get('messages').get(AppState.get('selectedMessage').get())),
                    EmailBody(AppState.get('messages').get(AppState.get('selectedMessage').get())),
                ]
            }),
        ]
    })
}

export function rightColum() {
    return VBox({
        fixedWidth:400,
        fixedHeight: 300,
        crossAxisSelfLayout: 'shrink',
        children: [
            EmailHeaderView(AppState.get('messages').get(AppState.get('selectedMessage').get())),
            EmailBody(AppState.get('messages').get(AppState.get('selectedMessage').get())),
        ]
    })
}
