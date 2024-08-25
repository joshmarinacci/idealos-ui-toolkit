import {HBox, HSpacer, VBox} from "../layout.ts";
import {ScrollContainer} from "../scroll.ts";
import {ListItemRenderer, ListView, ListViewItem} from "../listView.ts";
import {Button, DropdownButton, IconButton} from "../buttons.ts";
import {Label, TextBox, WrappingLabel} from "../text.ts";
import {Icon, Icons} from "../icons.ts";
import {ObjAtom, Schema} from "rtds-core"
import {StateHandler} from "../base.ts";


const S = new Schema()

const EmailAccount = S.enum(['Work', 'home'], 'home')
const emailAccount = EmailAccount.cloneWith('Work')
const Folder = S.map({
    name: S.string(),
    count: S.number(),
    icon: S.string(),
}, {typeName: "Folder"})
type EmailFolder = typeof Folder
const Folders = S.list(Folder)
const email_folders = Folders.cloneWith([
    {name: "Inbox", count: 128, icon: Icons.Inbox},
    {name: 'Drafts', count: 9, icon: Icons.Draft},
    {name: 'Sent', count: -1, icon: Icons.Send},
    {name: 'Junk', count: 23, icon: Icons.Delete},
    {name: 'Trash', count: -1, icon: Icons.Delete},
    {name: 'Archive', count: -1, icon: Icons.Archive},
    {name: 'Social', count: 972, icon: Icons.Group},
    {name: 'Updates', count: 342, icon: Icons.Info},
    {name: 'Forums', count: 128, icon: Icons.Forum},
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
        sender: "Emily Davis",
        subject: "Re: Question about Budget",
        date: Date.now(),
        body: "I have a question about the budget for the upcoming project.",
        tags: ["work", "budget"],
        unread: true,
    },
    {
        sender: "Michael Wilson",
        subject: "Important Annoucnement",
        date: Date.now(),
        body: "I have an important announcement to make during our team meeting. It pertains to a strategic shift in our approach",
        unread: true,
        tags: ['meeting', 'work', 'important'],
    }
])
const InboxFilter = S.enum(["All mail", "Unread"], "Unread")
const filter = InboxFilter.cloneWith("Unread")


const AppState = S.map({
    email_folders: email_folders,
    selectedFolder: S.number(),
    messages: messages,
    selectedMessage: S.number()
})

const EmailMessRenderer: ListItemRenderer<typeof EmailMessage> = (item, selected, index, onSelectedChanged) => {
    return ListViewItem({
        selected: index === selected,
        mainAxisLayout: 'center',
        handleEvent: (e) => {
            if (e.type === 'mouse-down') {
                onSelectedChanged(index, e)
            }
        },
        children: [
            VBox({
                shadow:true,
                mainAxisSelfLayout: 'shrink',
                visualStyle: {
                    background: index==selected?'orange':'white',
                },
                children: [
                    Label({text: item.get('sender').get(), shadow: true}),
                    WrappingLabel({
                        text: item.get('subject').get(), fixedWidth: 150,
                        shadow: true
                    }),
                    WrappingLabel({text: item.get('body').get().substring(0,30)+'...', fixedWidth: 150, shadow: true})
                ]
            }),
        ],
    })
}
const EmailFolderRenderer: ListItemRenderer<EmailFolder> = (item, selected, index, onSelectedChanged) => {
    return ListViewItem({
        selected: index == selected,
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
            Label({text: mess.get('sender').get()}),
            Label({text: mess.get('subject').get()}),
        ]
    })
}

function EmailBody(selectedMessage: typeof EmailMessage) {
    let body = WrappingLabel({
        text: selectedMessage.get('body').get(),
        fixedWidth: 300,
    })
    return ScrollContainer({
        fixedWidth: 300,
        key: 'email-body',
        fixedHeight: 200,
        child: body,
    })
}

function atomAsStateHandler<T>(atom:ObjAtom<T>) {
    const hand:StateHandler<T> = {
        get:() => atom.get(),
        set:(v:T) => atom.set(v)
    }
    return hand
}

export function EmailDemo() {
    return HBox({
        children: [
            VBox({
                mainAxisSelfLayout: 'shrink',
                crossAxisSelfLayout: 'shrink',
                children: [
                    DropdownButton({
                        text: "Work", children: [
                            Button({text: "Work"}),
                            Button({text: "Personal"}),
                        ]
                    }),
                    ScrollContainer({
                        key: 'email-folders-scroll',
                        fixedWidth: 150,
                        fixedHeight: 300,
                        child: ListView({
                            key: "email-folder-list",
                            data: AppState.get('email_folders'),
                            selected: atomAsStateHandler(AppState.get('selectedFolder')),
                            renderItem: EmailFolderRenderer,
                        })
                    })
                ]
            }),
            VBox({
                mainAxisSelfLayout: 'shrink',
                crossAxisSelfLayout: 'shrink',
                children: [
                    HBox({
                        mainAxisSelfLayout: 'shrink',
                        children: [
                            Label({text: "Inbox"}),
                            Button({text: "All Mail"}),
                            Button({text: "Unread"}),
                        ]
                    }),
                    TextBox({
                        multiline: false,
                        text: "search",
                        fixedWidth: 150,
                    }),
                    ScrollContainer({
                        key: 'email-inbox-scroll',
                        fixedWidth: 150,
                        fixedHeight: 200,
                        child: ListView({
                            key: "email-inbox",
                            data: messages,
                            selected:atomAsStateHandler(AppState.get('selectedMessage')),
                            renderItem: EmailMessRenderer,
                        })
                    })
                ]
            }),
            VBox({
                crossAxisSelfLayout: 'shrink',
                children: [
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
                    EmailHeaderView(AppState.get('messages').get(AppState.get('selectedMessage').get())),
                    EmailBody(AppState.get('messages').get(AppState.get('selectedMessage').get())),
                ]
            }),
        ]
    })
}
