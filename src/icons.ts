import {GElement, GRenderNode, LayoutConstraints, MGlobals, SYMBOL_FONT_ENABLED, TRANSPARENT, ZERO_INSETS} from "./base.js";
import {RenderContext, sizeWithPadding} from "./gfx.js";
import {IconFontSize, Style} from "./style.js";
import {Insets, Point, Size} from "josh_js_util";
import {KEY_VENDOR} from "./keys.js";

export enum Icons {
    LeftPanelCloseIcon = 'left_panel_close',
    LeftPanelOpenIcon = 'left_panel_open',
    RightPanelCloseIcon = 'right_panel_close',
    RightPanelOpenIcon = 'right_panel_open',
    Download = 'download',
    Undo = 'undo',
    Redo = 'redo',
    NewDocument = 'note_add',
    SaveDocument = 'save',
    UploadDocument = 'upload_file',
    Settings = 'settings',
    Add = 'add',
    Delete = 'delete',
    Search = 'search',
    Star = 'star',
    CheckboxChecked = 'check_box',
    CheckboxUnchecked = 'check_box_outline_blank',
    RadioButtonChecked = 'radio_button_checked',
    RadioButtonUnchecked = 'radio_button_unchecked',
    Document = 'description',
    Page = 'note',
    Color = 'palette',
    Gradient = 'gradient',
    Image = 'image',
    Number = '123',
    Shape = 'pentagon',
    OpenDocument = 'file_open',
    Archive ='Archive',
    DeleteForever = 'delete_forever',
    Snooze = 'snooze',
    Reply = 'reply',
    ReplyAll = 'reply_all',
    Forward = 'forward',
    Inbox = 'inbox',
    Draft = 'draft',
    Send = 'send',
    Group = 'group',
    Info = 'info',
    Forum = 'forum',
    ShoppingCart = 'shopping_cart',
    ToggleOn = 'toggle_on',
    ToggleOff= 'toggle_off',
    KeyboardArrowLeft = 'keyboard_arrow_left',
    KeyboardArrowRight = 'keyboard_arrow_right',
    KeyboardArrowUp = 'keyboard_arrow_up',
    KeyboardArrowDown = 'keyboard_arrow_down',
    DragHandle = 'drag_handle',
    Resize = 'resize',
}

export class IconElement implements GElement {
    private icon: Icons;
    private shadow: boolean;
    private fontSize: number;

    constructor(opts: { icon: Icons, shadow?: boolean, fontSize?:number }) {
        this.icon = opts.icon
        this.shadow = opts.shadow || false
        this.fontSize = opts.fontSize || IconFontSize
    }

    layout(_rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        let key = KEY_VENDOR.getKey()
        let size = new Size(this.fontSize, this.fontSize)
        const padding= new Insets(0,7,0,0)
        size = sizeWithPadding(size,padding)
        return new GRenderNode({
            key:key,
            visualStyle: {
                background: MGlobals.get(SYMBOL_FONT_ENABLED) === true ? TRANSPARENT : "red",
                borderColor: "",
                textColor: Style.base().textColor,
            },
            baseline: this.fontSize,
            borderWidth: ZERO_INSETS,
            children: [],
            contentOffset: new Point(0, 0),
            font: 'material-icons',
            fontSize: this.fontSize,
            fontWeight: Style.base().fontWeight,
            kind: `icon: ${this.icon}`,
            padding: padding,
            pos: new Point(0, 0),
            size: size,
            text: MGlobals.get(SYMBOL_FONT_ENABLED) === true ? this.icon : "",
            shadow: this.shadow
        })
    }
}

export function Icon(opts:{icon:Icons}) {
    return new IconElement({
        icon: opts.icon
    })
}
