import {GElement, GRenderNode, LayoutConstraints, MGlobals, SYMBOL_FONT_ENABLED, TRANSPARENT, ZERO_INSETS} from "./base.js";
import {RenderContext} from "./gfx.js";
import {Style} from "./style.js";
import {Point, Size} from "josh_js_util";
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

    constructor(opts: { icon: Icons, shadow?: boolean }) {
        this.icon = opts.icon
        this.shadow = opts.shadow || false
    }

    layout(_rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        let key = KEY_VENDOR.getKey()
        return new GRenderNode({
            key:key,
            visualStyle: {
                background: MGlobals.get(SYMBOL_FONT_ENABLED) === true ? TRANSPARENT : "red",
                borderColor: "",
                textColor: Style.base().textColor,
            },
            baseline: 24,
            borderWidth: ZERO_INSETS,
            children: [],
            contentOffset: new Point(0, 0),
            // font: "24px material-symbols-outlined",
            // font :`24px "Material Symbols Outlined"`,
            font :`24px material-icons"`,
            kind: `icon: ${this.icon}`,
            margin: ZERO_INSETS,
            padding: ZERO_INSETS,
            pos: new Point(0, 0),
            size: new Size(24, 24),
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
