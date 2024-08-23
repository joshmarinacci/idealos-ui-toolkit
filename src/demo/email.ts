import {HBox, HSpacer, VBox} from "../layout.ts";
import {ScrollContainer} from "../scroll.ts";
import {Point} from "josh_js_util";
import {ListItemRenderer, ListView, ListViewItem} from "../listView.ts";
import {Button, IconButton} from "../buttons.ts";
import {Label, TextBox} from "../text.ts";
import {Icons} from "../icons.ts";
import {EmailMessage} from "rtds-core/build/test-models";

type EmailFolder = {
    name: string,
    icon: Icons,
    count: number
}
const email_folders: EmailFolder[] = [
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
]


type EmailMessage = {
    sender: string,
    subject: string,
    date: number,
    body: string,
    unread: boolean
    tags:string[]
}

const messages: EmailMessage[] = [
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
]


const state = {
    email_folders: email_folders,
    selectedFolder: 2,
    selectedMessage: messages[0]
}
const EmailMessRenderer: ListItemRenderer<EmailMessage> = (item) => {
    return VBox({
        mainAxisSelfLayout: 'shrink',
        children: [
            Label({text: item.sender, shadow: true}),
            Label({text: item.subject, shadow: true}),
            Label({text: item.body, multiline: true, shadow: true})
        ],
    })
}
const EmailFolderRenderer: ListItemRenderer<EmailFolder> = (item, selected, index, onSelectedChanged) => {
    return ListViewItem({
        selected: index == selected,
        mainAxisLayout: 'between',
        handleEvent: (e) => onSelectedChanged(index, e),
        children: [
            IconButton({icon: item.icon, ghost: true}),
            Label({text: item.name, shadow: true}),
            HSpacer(),
            Label({text: item.count + "", shadow: true}),
        ]
    })
}

const EmailHeaderView = (mess:EmailMessage) => {
    return HBox({children:[
            Label({text:mess.sender}),
            Label({text:mess.subject}),
        ]})
}

function EmailBody(selectedMessage: EmailMessage) {
    let body = Label({text:selectedMessage.body, multiline:true})
    return ScrollContainer({
        fixedWidth:400,
        key:'email-body',
        fixedHeight:400,
        child: body,
    })
    // return body
}

export function EmailDemo() {
    return HBox({
        children: [
            VBox({
                mainAxisSelfLayout: 'shrink',
                crossAxisSelfLayout: 'shrink',
                children: [
                    Button({text: "Work"}),
                    ScrollContainer({
                        key: 'email-folders-scroll',
                        fixedWidth: 200,
                        fixedHeight: 300,
                        child: ListView({
                            key: "email-folder-list",
                            data: state.email_folders,
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
                        mainAxisSelfLayout:'shrink',
                        children: [
                            Label({text: "Inbox"}),
                            Button({text: "All Mail"}),
                            Button({text: "Unread"}),

                        ]
                    }),
                    TextBox({
                        multiline: false,
                        text: "search",
                        inputid: "search-box",
                        cursorPosition: new Point(0, 0),
                        onChange: () => {

                        }
                    }),
                    ScrollContainer({
                        key: 'email-inbox-scroll',
                        fixedWidth: 200,
                        fixedHeight: 200,
                        child: ListView({
                            key: "email-inbox",
                            data: messages,
                            renderItem: EmailMessRenderer,
                        })
                    })
                ]
            }),
            VBox({
                crossAxisSelfLayout:'shrink',
                children: [
                    HBox({
                        children: [
                            IconButton({icon: Icons.Archive, ghost: true}),
                            IconButton({icon: Icons.DeleteForever, ghost: true}),
                            IconButton({icon: Icons.Delete, ghost: true}),
                            // HSep(),
                            IconButton({icon: Icons.Snooze, ghost: true}),
                            IconButton({icon: Icons.Reply, ghost: true}),
                            IconButton({icon: Icons.ReplyAll, ghost: true}),
                            IconButton({icon: Icons.Forward, ghost: true}),
                            // HSep()
                            IconButton({icon: Icons.LeftPanelCloseIcon, ghost: true}),
                        ]
                    }),
                    EmailHeaderView(state.selectedMessage),
                    EmailBody(state.selectedMessage),
                ]
            }),
        ]
    })
    // HBox({children:[
    // ]})
    // const lv = ListView({
    //     data:["a","b",'C','d','e','f','g','h','i','j','k'],
    //     key:"email-lv-1",
    //     selected: state.selectedItem,
    //     onSelectedChanged:(a,e) => {
    //         state.selectedItem = a
    //         e.redraw()
    //     }
    // })
    // return HBox({
    //     children: [
    //         ScrollContainer({
    //             fixedWidth:300,
    //             fixedHeight:200,
    //             // scrollOffset: state.scrollOffset,
    //             child: lv,
    //             key:'email-scroll'
    //             // onScrollChanged: (p,e) => {
    //             //     state.scrollOffset = p
    //             //     e.redraw()
    //             // }
    //         })
    //     ]
    // })
}
