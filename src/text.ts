import {
    CEvent,
    ElementSettings,
    GElement,
    GRenderNode,
    LayoutConstraints,
    MGlobals,
    MKeyboardEvent,
    TRANSPARENT,
    ZERO_INSETS,
    ZERO_POINT
} from "./base.ts";
import {RenderContext, sizeWithPadding, withInsets} from "./gfx.ts";
import {Style} from "./style.ts";
import {Insets, Point, Size} from "josh_js_util";
import {addInsets} from "./util.ts";
import {STATE_CACHE, StateCache} from "./state.ts";

type OnChangeCallback<T> = (value: T, e: CEvent) => void
type TextInputSettings = {
    text: string
    cursorPosition: Point
    inputid: string
    onChange: OnChangeCallback<[string,Point]>
}
type TextInputRequirements = {
    text: string
    cursorPosition: Point
    inputid: string
    onChange: OnChangeCallback<[string,Point]>
    margin: Insets
    padding: Insets
    borderWidth: Insets
}

const META_KEYS = ['Shift','Enter','Control','Alt','Meta']

type KeyStrokeDef = { key: string, control?:boolean}
type KeyActionArgs = {text:string, pos:Point, key?:string}
type KeyAction = (args:KeyActionArgs) => {text:string, pos:Point}

class ActionMap {
    actions: Map<string, any>;
    keystrokes: Map<any, any>;
    controls: Map<string,string>
    constructor() {
        this.actions = new Map()
        this.keystrokes = new Map()
        this.controls = new Map()
    }
    addAction(name: string, cb: KeyAction) {
        this.actions.set(name,cb)
    }
    match(e: KeyStrokeDef):string|undefined {
        if(e.control) {
            return this.controls.get(e.key)
        }
        return this.keystrokes.get(e.key)
    }

    registerKeystroke(def:KeyStrokeDef, action:string) {
        if(def.control) {
            this.controls.set(def.key,action)
        } else {
            this.keystrokes.set(def.key,action)
        }
    }
}

const ACTION_MAP = new ActionMap()
ACTION_MAP.addAction('cursor-backward',(args:KeyActionArgs) => {
    return {
        text:args.text,
        pos:args.pos.subtract(new Point(1, 0)),
    }
})
ACTION_MAP.addAction('cursor-forward',(args:KeyActionArgs) => {
    return {
        text:args.text,
        pos:args.pos.add(new Point(1, 0)),
    }
})
ACTION_MAP.addAction('delete-backward',(args:KeyActionArgs) => {
    const {text,pos} = args
    if(text.length > 0) {
        return {
            text: text.substring(0,args.pos.x-1) + text.substring(args.pos.x),
            pos: pos.subtract(new Point(1,0)),
        }
    } else {
        return { text, pos }
    }
})
ACTION_MAP.addAction('delete-forward',(args:KeyActionArgs) => {
    const {text,pos} = args
    if(text.length > 0) {
        return {
            text: text.substring(0,args.pos.x) + text.substring(args.pos.x+1),
            pos: pos.copy()
        }
    } else {
        return { text, pos }
    }
})
ACTION_MAP.addAction('insert-character',(args:KeyActionArgs)=> {
    const {text, pos, key} = args
    let before = text.substring(0, pos.x)
    let after = text.substring(pos.x)
    return {text:before + key + after, pos:pos.add(new Point(1,0))}
})

ACTION_MAP.registerKeystroke({key:'f',control:true},'cursor-forward')
ACTION_MAP.registerKeystroke({key:'b',control:true},'cursor-backward')
ACTION_MAP.registerKeystroke({key:'ArrowLeft'},'cursor-backward')
ACTION_MAP.registerKeystroke({key:'ArrowRight'},'cursor-forward')

ACTION_MAP.registerKeystroke({key:'Backspace'},'delete-backward')
ACTION_MAP.registerKeystroke({key:'d', control:true},'delete-forward')

function processText(text: string, cursorPosition: Point, kbe: MKeyboardEvent):[string, Point] {
    if(META_KEYS.includes(kbe.key)) return [text,cursorPosition]
    let action_name = ACTION_MAP.match(kbe)
    if(action_name) {
        let action_impl = ACTION_MAP.actions.get(action_name)
        if(action_impl) {
            let res = ACTION_MAP.actions.get(action_name)({text,pos:cursorPosition})
            return [res.text, res.pos]
        }
    }
    let res = ACTION_MAP.actions.get('insert-character')({text, pos:cursorPosition, key:kbe.key})
    return [res.text, res.pos]
}

export class TextElement implements GElement {
    settings: ElementSettings;

    constructor(settings: ElementSettings) {
        this.settings = settings
    }

    layout(rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        rc.ctx.font = this.settings.font
        let metrics = rc.ctx.measureText(this.settings.text)
        let size = new Size(
            Math.floor(metrics.width),
            Math.floor(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent))
        size = sizeWithPadding(size, this.settings.padding)
        size = sizeWithPadding(size, this.settings.margin)
        size = sizeWithPadding(size, this.settings.borderWidth)
        return new GRenderNode({
            id: "text element",
            text: this.settings.text,
            font: Style.font,
            size: size,
            pos: new Point(0, 0),
            contentOffset: new Point(this.settings.padding.left, this.settings.padding.top),
            baseline: metrics.emHeightAscent + metrics.emHeightDescent,
            visualStyle: this.settings.visualStyle,
            children: [],
            padding: this.settings.padding,
            margin: this.settings.margin,
            borderWidth: this.settings.borderWidth,
            shadow: this.settings.shadow,
        })
    }
}

class TextInputElement implements GElement {
    private opts: TextInputRequirements

    constructor(opts: TextInputSettings) {
        this.opts = {
            ...opts,
            borderWidth: withInsets(1),
            margin: Style.buttonMargin,
            padding: Style.buttonPadding,
        }
    }

    layout(rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        // console.log("redoing layout",this.opts.text)
        const cache:StateCache = MGlobals.get(STATE_CACHE)
        cache.startLayout(this.opts.inputid)
        let [cursorPosition,setCursorPosition] = cache.useState("cursor",() => {
            return new Point(0,0)
        })
        let text = new TextElement({
            borderWidth: ZERO_INSETS,
            font: Style.font,
            margin: ZERO_INSETS,
            padding: ZERO_INSETS,
            shadow: true,
            visualStyle: {
                textColor: Style.textColor,
                background: TRANSPARENT,
                borderColor: TRANSPARENT,
            },
            text:this.opts.text
        })
        let text_node = text.layout(rc,_cons)
        const cursor_node = this.makeCursor()

        rc.ctx.font = Style.font
        let text_before = this.opts.text.substring(0,cursorPosition.x)
        // console.log("text before is",text_before, this.opts.cursorPosition)
        let metrics = rc.ctx.measureText(text_before)
        let total_insets = addInsets(addInsets(this.opts.margin, this.opts.borderWidth), this.opts.padding)
        text_node.settings.pos.x = total_insets.left
        text_node.settings.pos.y = total_insets.top

        cursor_node.settings.pos.x = metrics.width + total_insets.left
        cursor_node.settings.pos.y = total_insets.top
        cursor_node.settings.size.h = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
        const size = new Size(200,100)
        let node = new GRenderNode({
            id: 'text-input-node',
            inputid: this.opts.inputid,
            text:"",
            visualStyle: {
                background: '#f0f0f0',
                borderColor: '#ccc',
                textColor: 'black',
            },
            focusedStyle: {
                background: 'hsl(47,100%,79%)',
                borderColor: 'black'
            },
            baseline: 10,//metrics.emHeightAscent + metrics.emHeightDescent,
            borderWidth: withInsets(1),
            children: [text_node,cursor_node],
            contentOffset: new Point(total_insets.left, total_insets.top),
            font: Style.font,
            margin: this.opts.margin,
            padding: this.opts.padding,
            pos: new Point(0, 0),
            size: size,
            clip: true,
            handleEvent: (e) => {
                if (e.type === 'keyboard-typed') {
                    let kbe = e as MKeyboardEvent;
                    let t2 = processText(this.opts.text,cursorPosition,kbe)
                    setCursorPosition(t2[1])
                    this.opts.onChange(t2, e)
                }
            }
        })

        cache.endLayout(this.opts.inputid)
        return node
    }

    private makeCursor() {
        return new GRenderNode({
            children: [],
            contentOffset: new Point(5,5),
            font: Style.font,
            id: "",
            pos: ZERO_POINT.copy(),
            size: new Size(2,50),
            text:'hithere',
            padding:ZERO_INSETS,
            margin: ZERO_INSETS,
            borderWidth:ZERO_INSETS,
            visualStyle: {
                background: 'red',
                borderColor:'blue',
                textColor:TRANSPARENT,
            },
            shadow:true,
            baseline:0

        })
    }
}

export function TextBox(param: TextInputSettings): GElement {
    const cache:StateCache =  MGlobals.get(STATE_CACHE);
    cache.startElement(param.inputid)
    let elem = new TextInputElement(param)
    cache.endElement(param.inputid)
    return elem
}


export function Label(opts: { text: string, shadow?: boolean }) {
    return new TextElement({
        text: opts.text,
        visualStyle: {
            textColor: Style.textColor,
            borderColor: TRANSPARENT,
            background: TRANSPARENT,
        },
        padding: withInsets(5),
        font: Style.font,
        margin: withInsets(5),
        borderWidth: ZERO_INSETS,
        shadow: opts.shadow ? opts.shadow : false
    })
}
