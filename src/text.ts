import {
    CEvent,
    ElementSettings,
    GElement,
    GRenderNode,
    LayoutConstraints,
    MKeyboardEvent,
    StateHandler,
    TRANSPARENT,
    useState, VisualStyle,
    ZERO_INSETS,
    ZERO_POINT
} from "./base.js";
import {RenderContext, sizeWithPadding, withInsets} from "./gfx.js";
import {Style} from "./style.js";
import {Point, Size} from "josh_js_util";
import {getTotalInsets} from "./util.js";
import {ACTION_MAP, KeyActionArgs, META_KEYS} from "./actions.js";
import {KEY_VENDOR} from "./keys.js";

type OnChangeCallback<T> = (value: T, e: CEvent) => void

type TextInputElementSettings = {
    text?: StateHandler<string>
    onChange?: OnChangeCallback<[string,Point]>
    multiline:boolean
    fixedWidth?:number,
    fixedHeight?:number,
} & ElementSettings

class TextModel {
    private readonly lines: string[];
    constructor(text: string) {
        this.lines = text.split('\n')
    }

    splitLineAt(pos: Point) {
        let line = this.lines[pos.y]
        let before = line.substring(0, pos.x)
        let after = line.substring(pos.x)
        this.lines.splice(pos.y, 1,before,after)
    }

    mergeLineAt(pos: Point) {
        let line = this.lines[pos.y]
        let line2 = this.lines[pos.y+1]
        let newLine = line + line2
        this.lines.splice(pos.y, 2,newLine)
    }

    toText() {
        return this.lines.join("\n")
    }

    lineLengthAt(pos: Point) {
        return this.lines[pos.y].length
    }

    lineCount() {
        return this.lines.length
    }

    deleteCharAt(pos: Point) {
        let line = this.lines[pos.y]
        let char = line.substring(pos.x-1,pos.x)
        let before = line.substring(0, pos.x-1)
        let after = line.substring(pos.x)
        line = before + after
        this.lines[pos.y] = line
        return char
    }

    insertCharAt(pos: Point, key: string | undefined) {
        let line = this.lines[pos.y]
        let before = line.substring(0, pos.x)
        let after = line.substring(pos.x)
        line = before + key + after
        this.lines[pos.y] = line
    }

}

ACTION_MAP.addAction('cursor-backward',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let pos = args.pos.subtract(new Point(1,0))
    if(pos.x < 0) {
        if(pos.y > 0) {
            pos = new Point(model.lineLengthAt(pos),pos.y-1)
        } else {
            pos = ZERO_POINT.copy()
        }
    }
    return {
        text:args.text,
        pos:pos,
    }
})
ACTION_MAP.addAction('cursor-forward',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let pos = args.pos.add(new Point(1,0))
    if(pos.x >= model.lineLengthAt(pos)) {
        if(pos.y < model.lineCount()-1) {
            pos.x = 0
            pos.y += 1
        } else {
            pos.x = model.lineLengthAt(pos)
        }
    }
    return {
        text:model.toText(),
        pos:pos
    }
})
ACTION_MAP.addAction('cursor-previous-line',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let pos = args.pos.copy()
    if(pos.y > 0) {
        pos.y -= 1
    }
    return {
        text:model.toText(),
        pos:pos
    }
})
ACTION_MAP.addAction('cursor-next-line',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let pos = args.pos.copy()
    if(pos.y < model.lineCount()-1) {
        pos.y += 1
    }
    return {
        text:model.toText(),
        pos:pos
    }
})
ACTION_MAP.addAction('delete-backward',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let pos = args.pos.copy()
    if(pos.x > 0) {
        model.deleteCharAt(pos)
        pos.x -= 1
    }
    if(pos.x === 0 && pos.y > 0) {
        pos.y -= 1
        pos.x = model.lineLengthAt(pos)
        model.mergeLineAt(pos)
    }
    return {
        text:model.toText(),
        pos:pos
    }

})
ACTION_MAP.addAction('delete-forward',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let pos = args.pos.copy()
    let p2 = pos.add(new Point(1,0))
    if(pos.x < model.lineLengthAt(p2)) {
        model.deleteCharAt(p2)
    }
    if(pos.x == model.lineLengthAt(p2) && pos.y < model.lineCount()-1) {
        model.mergeLineAt(p2)
    }
    return {
        text:model.toText(),
        pos:pos
    }
})
ACTION_MAP.addAction('insert-character',(args:KeyActionArgs)=> {
    let model = new TextModel(args.text)
    let pos = args.pos.copy()
    if(args.key === 'space') args.key = ' '
    model.insertCharAt(pos,args.key)
    return {
        text:model.toText(),
        pos:new Point(pos.x+1,pos.y)
    }
})
ACTION_MAP.addAction('insert-newline', (args) => {
    let model = new TextModel(args.text)
    model.splitLineAt(args.pos)
    let pos = new Point(0,args.pos.y+1)
    return {text:model.toText(), pos:pos}
})

function processText(text: string, cursorPosition: Point, kbe: MKeyboardEvent):[string, Point] {
    if(META_KEYS.includes(kbe.key)) return [text,cursorPosition]
    let action_name = ACTION_MAP.match(kbe)
    // console.log('TEXT-INPUT, action name',action_name, 'pos',cursorPosition)
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

type TextElementSettings = {
    multiline?:boolean
    wrapping?:boolean
    fixedWidth?:number
    bold?:boolean
    text:string
    visualStyle:VisualStyle
} & ElementSettings


export class TextElement implements GElement {
    settings: TextElementSettings;

    constructor(settings: TextElementSettings) {
        this.settings = settings
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        if(this.settings.fixedWidth || this.settings.wrapping) return this.layout_wrapping(rc,cons)
        if(this.settings.multiline) return this.layout_multiline(rc,cons);
        return this.layout_single_line_no_wrapping(rc,cons)
    }

    private layout_multiline(rc: RenderContext, _cons: LayoutConstraints) {
        // rc.ctx.font = calcCanvasFont(this.settings.fontSettings)
        let key = KEY_VENDOR.getKey()
        let [textsize,baseline] = this.calcMetrics(rc)
        let lineHeight = textsize.h
        let lines = this.settings.text.split('\n')
        let y = 0
        let total_insets = getTotalInsets(this.settings)
        let size = new Size(0,0)
        size.w = textsize.w
        size.h = textsize.h
        if(this.settings.fixedWidth) {
            size.w = this.settings.fixedWidth
        }
        let nodes:GRenderNode[] = lines.map(line => {
            let [m,_b] = rc.surface.measureText(line, {
                fontSize: this.settings.fontSettings?.fontSize,
                fontFamily: this.settings.fontSettings?.font
            })
            let pos = new Point(total_insets.left, total_insets.top+ y)
            y += lineHeight
            return new GRenderNode({
                key:key,
                shadow:true,
                kind:"text-line-element",
                text:line,
                font: Style.base().font,
                size: new Size(m.w,lineHeight),
                pos: pos,
                contentOffset: new Point(0,0),
                baseline: baseline,
                visualStyle: {
                    textColor: Style.base().textColor,
                    borderColor: TRANSPARENT,
                    background: TRANSPARENT,
                },
                padding: ZERO_INSETS,
                borderWidth: ZERO_INSETS,
                children: []
            })
        })

        size = sizeWithPadding(size,total_insets)
        return new GRenderNode({
            ... this.settings,
            key:key,
            kind: "text-multiline-element",
            text:"",
            font: Style.base().font,
            size: size,
            pos: new Point(0, 0),
            contentOffset: new Point(total_insets.left, total_insets.top),
            baseline: baseline,
            children: nodes,
        })
    }

    private layout_wrapping(rc: RenderContext, _cons: LayoutConstraints) {
        let key = KEY_VENDOR.getKey()

        // rc.ctx.font = calcCanvasFont(this.settings.fontSettings)
        let [textsize, baseline] = this.calcMetrics(rc)
        let lineHeight = textsize.h
        let words = this.settings.text.split(' ')
        let x = 0
        let total_insets = getTotalInsets(this.settings)

        let size = new Size(0,0)
        if(this.settings.fixedWidth) {
            size.w = this.settings.fixedWidth as number
        } else {
            size.w = _cons.space.w
        }
        size.h = textsize.h
        size.w -= (total_insets.left + total_insets.right)
        size.h += (total_insets.top + total_insets.bottom)

        let lines:string[] = []
        let current_line = ""
        for(let word of words) {
            word = word + " "
            let [wsize,_wbaseline] = rc.surface.measureText(word,{
                fontSize: this.settings.fontSettings?.fontSize,
                fontFamily: this.settings.fontSettings?.font
            })
            // let word_width = rc.ctx.measureText(word).width
            let word_width = wsize.w
            if(x + word_width > size.w) {
                lines.push(current_line)
                current_line = word
                x = word_width
            } else {
                current_line += word
                x += word_width
            }
        }
        lines.push(current_line)
        let y = 0
        let nodes:GRenderNode[] = lines.map(line => {
            let [lsize,_lbaseline] = rc.surface.measureText(line,{
                fontSize: this.settings.fontSettings?.fontSize,
                fontFamily: this.settings.fontSettings?.font
            })
            let pos = new Point(total_insets.left, total_insets.top+ y)
            y += lineHeight
            return new GRenderNode({
                ... this.settings,
                key:key,
                kind:"text-line-element",
                shadow:true,
                text:line,
                font: Style.base().font,
                size: new Size(lsize.w,lineHeight),
                pos: pos,
                contentOffset: new Point(0,0),
                baseline: baseline,
                visualStyle: {
                    textColor: Style.base().textColor,
                    borderColor: TRANSPARENT,
                    background: TRANSPARENT,
                },
                padding: ZERO_INSETS,
                borderWidth: ZERO_INSETS,
                children: []
            })
        })

        size.h = y
        size = sizeWithPadding(size,total_insets)
        return new GRenderNode({
            key:key,
            kind: "text-multiline-element",
            text:"",
            font: Style.base().font,
            size: size,
            pos: new Point(0, 0),
            contentOffset: new Point(total_insets.left, total_insets.top),
            baseline: baseline,
            visualStyle: this.settings.visualStyle,
            children: nodes,
            padding: this.settings.padding,
            borderWidth: this.settings.borderWidth,
            shadow: this.settings.shadow,
        })

    }

    private calcMetrics(rc: RenderContext):[Size,number] {
        return rc.surface.measureText(this.settings.text, {
            fontFamily: this.settings.fontSettings?.font || 'sans-serif',
            fontSize: this.settings.fontSettings?.fontSize || 16,
        })
    }

    private layout_single_line_no_wrapping(rc: RenderContext, _cons: LayoutConstraints) {
        let key = KEY_VENDOR.getKey()
        let [size,baseline] = this.calcMetrics(rc)
        let ins = getTotalInsets(this.settings)
        size = sizeWithPadding(size, ins)
        return new GRenderNode({
            ...this.settings,
            kind: "text-singleline-element",
            font: Style.base().font,
            fontSize: this.settings.fontSettings?.fontSize || Style.base().fontSize,
            fontWeight: this.settings.bold?"bold":Style.base().fontWeight,
            size: size,
            pos: new Point(0, 0),
            contentOffset: new Point(ins.left, ins.top),
            baseline: baseline,
            children: [],
            key:key,
        })

    }
}

class TextInputElement implements GElement {
    private readonly settings: TextInputElementSettings

    constructor(opts: TextInputElementSettings) {
        this.settings = {
            ...opts,
            multiline: opts.multiline?opts.multiline:false,
            borderWidth: withInsets(1),
            padding: Style.button().padding,
            fontSettings: {
                font: Style.base().font,
                fontSize: Style.base().fontSize,
                fontWeight: Style.base().fontWeight,
            },
        }
    }

    private calcMetrics(rc: RenderContext, text:string):[Size,number] {
        return rc.surface.measureText(text, {
            fontSize: this.settings.fontSettings?.fontSize,
            fontFamily: this.settings.fontSettings?.font
        })
    }

    layout(rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        const key = KEY_VENDOR.getKey()
        let [textString, setText] = useState(key,"text",this.settings.text,()=>"")
        let [cursorPosition, setCursorPosition]= useState(key,"cursor",undefined,()=>new Point(0,0))
        let [focused, setFocused] = useState(key,"focused",undefined,()=>false)
        let text = new TextElement({
            borderWidth: ZERO_INSETS,
            fontSettings: {
                font: Style.base().font,
                fontSize: Style.base().fontSize,
                fontWeight: Style.base().fontWeight,
            },
            padding: ZERO_INSETS,
            shadow: true,
            visualStyle: {
                textColor: Style.base().textColor,
                background: TRANSPARENT,
                borderColor: TRANSPARENT,
            },
            text:textString,
            multiline: this.settings.multiline,
        })
        let text_node = text.layout(rc,_cons)
        const cursor_node = this.makeCursor()

        let lines = textString.split("\n")
        let line = lines[cursorPosition.y]
        let text_before = line.substring(0,cursorPosition.x)
        let [metrics, baseline] = this.calcMetrics(rc, text_before)
        let total_insets = getTotalInsets(this.settings)
        text_node.settings.pos = new Point(total_insets.left, total_insets.top)

        cursor_node.settings.pos = new Point(
            total_insets.left + metrics.w  ,
            total_insets.top + cursorPosition.y * baseline
        )
        cursor_node.settings.size.h = metrics.h
        const size = new Size(100,100)
        if(this.settings.fixedWidth) {
            size.w = this.settings.fixedWidth
        }
        if(this.settings.fixedHeight) {
            size.h = this.settings.fixedHeight
        } else {
            size.h = total_insets.top + text_node.settings.size.h + total_insets.bottom
        }
        const focusedStyle = {
            background: 'hsl(47,100%,79%)',
            borderColor: 'magenta'
        }
        const visualStyle = {
            background: '#f0f0f0',
            borderColor: '#ccc',
            textColor: 'magenta',
        }
        return new GRenderNode({
            kind: 'text-input-node',
            key:key,
            text: "",
            visualStyle: visualStyle,
            focusedStyle:focusedStyle,
            baseline: baseline,
            borderWidth: withInsets(1),
            children: [text_node, cursor_node],
            contentOffset: new Point(total_insets.left, total_insets.top),
            font: Style.base().font,
            padding: this.settings.padding,
            pos: new Point(0, 0),
            size: size,
            clip: true,
            handleEvent: (e) => {
                if (e.type === 'keyboard-typed') {
                    if(!focused) setFocused(true)
                    let kbe = e as MKeyboardEvent;
                    let t2 = processText(textString, cursorPosition, kbe)
                    setText(t2[0])
                    setCursorPosition(t2[1])
                    e.use()
                    e.redraw()
                }
            }
        })
    }

    private makeCursor() {
        const key = KEY_VENDOR.getKey()
        return new GRenderNode({
            key:key,
            children: [],
            contentOffset: new Point(5,5),
            font: Style.base().font,
            kind: "",
            pos: ZERO_POINT.copy(),
            size: new Size(2,50),
            text:'hithere',
            padding:ZERO_INSETS,
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

export function TextBox(param: TextInputElementSettings): GElement {
    return new TextInputElement(param)
}


export function Label(opts: { text: string, shadow?: boolean, multiline?:boolean, bold?:boolean }) {
    return new TextElement({
        text: opts.text,
        visualStyle: {
            textColor: Style.base().textColor,
            borderColor: TRANSPARENT,
            background: TRANSPARENT,
        },
        padding: withInsets(5),
        fontSettings: {
            font: Style.base().font,
            fontSize: Style.base().fontSize,
            fontWeight: Style.base().fontWeight,
        },
        borderWidth: ZERO_INSETS,
        shadow: opts.shadow ? opts.shadow : false,
        multiline: opts.multiline ? opts.multiline : false,
        bold: opts.bold
    })
}

export function WrappingLabel(param: { fixedWidth?: number; text: string, shadow?:boolean }) {
    return new TextElement({
        text: param.text,
        multiline: true,
        wrapping:true,
        shadow: param.shadow||false,
        padding: Style.button().padding,
        borderWidth: ZERO_INSETS,
        fontSettings: {
            font: Style.base().font,
            fontSize: Style.base().fontSize,
            fontWeight:  Style.base().fontWeight,
        },
        fixedWidth: param.fixedWidth,
        visualStyle: {
            borderColor: TRANSPARENT,
            background: TRANSPARENT,
            textColor: Style.base().textColor,
        }
    })
}
