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
import {ACTION_MAP, KeyActionArgs, META_KEYS} from "./actions.ts";

type OnChangeCallback<T> = (value: T, e: CEvent) => void
type TextInputSettings = {
    text: string
    // cursorPosition: Point
    inputid: string
    onChange?: OnChangeCallback<[string,Point]>
    multiline?:boolean
}
type TextInputRequirements = {
    text: string
    // cursorPosition: Point
    inputid: string
    onChange?: OnChangeCallback<[string,Point]>
    margin: Insets
    padding: Insets
    borderWidth: Insets
    multiline:boolean
}

class TextModel {
    private lines: string[];
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
            pos.y--
            pos.x = model.lineLengthAt(pos)
        } else {
            pos.x = 0
            pos.y = 0
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
    model.insertCharAt(pos,args.key)
    pos.x += 1
    return {
        text:model.toText(),
        pos:pos
    }
})


ACTION_MAP.addAction('insert-newline', (args) => {
    let model = new TextModel(args.text)
    model.splitLineAt(args.pos)
    let pos = args.pos.copy()
    pos.x = 0
    pos.y += 1
    return {text:model.toText(), pos:pos}
})

function processText(text: string, cursorPosition: Point, kbe: MKeyboardEvent):[string, Point] {
    if(META_KEYS.includes(kbe.key)) return [text,cursorPosition]
    let action_name = ACTION_MAP.match(kbe)
    // console.log('action name',action_name, cursorPosition)
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
} & ElementSettings
export class TextElement implements GElement {
    settings: TextElementSettings;

    constructor(settings: TextElementSettings) {
        this.settings = settings
    }

    layout(rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        if(this.settings.multiline) return this.layout_multiline(rc,_cons);
        rc.ctx.font = this.settings.font
        let metrics = rc.ctx.measureText(this.settings.text)
        let size = new Size(
            Math.floor(metrics.width),
            Math.floor(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent))
        size = sizeWithPadding(size, this.settings.padding)
        size = sizeWithPadding(size, this.settings.margin)
        size = sizeWithPadding(size, this.settings.borderWidth)
        return new GRenderNode({
            id: "text-singleline-element",
            text: this.settings.text,
            font: Style.font,
            size: size,
            pos: new Point(0, 0),
            contentOffset: new Point(this.settings.padding.left, this.settings.padding.top),
            baseline: metrics.fontBoundingBoxAscent,
            visualStyle: this.settings.visualStyle,
            children: [],
            padding: this.settings.padding,
            margin: this.settings.margin,
            borderWidth: this.settings.borderWidth,
            shadow: this.settings.shadow,
        })
    }

    private layout_multiline(rc: RenderContext, _cons: LayoutConstraints) {
        rc.ctx.font = this.settings.font
        let metrics = rc.ctx.measureText("Testy")
        let baseline = metrics.fontBoundingBoxAscent
        let lineHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
        let lines = this.settings.text.split('\n')
        let y = 0
        let total_insets = addInsets(addInsets(this.settings.margin, this.settings.borderWidth), this.settings.padding)
        let nodes:GRenderNode[] = lines.map(line => {
            let metrics = rc.ctx.measureText(line)
            let pos = new Point(total_insets.left, total_insets.top+ y)
            y += lineHeight
            return new GRenderNode({
                id:"text-line-element",
                text:line,
                font: Style.font,
                size: new Size(metrics.width,lineHeight),
                pos: pos,
                contentOffset: new Point(0,0),
                baseline: baseline,
                visualStyle: {
                    textColor: Style.textColor,
                    borderColor: TRANSPARENT,
                    background: TRANSPARENT,
                },
                padding: ZERO_INSETS,
                margin: ZERO_INSETS,
                borderWidth: ZERO_INSETS,
                children: []
            })
        })

        let size = new Size(
            Math.floor(metrics.width),
            Math.floor(y+metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent))
        size = sizeWithPadding(size,total_insets)
        return new GRenderNode({
            id: "text-multiline-element",
            text:"",
            font: Style.font,
            size: size,
            pos: new Point(0, 0),
            contentOffset: new Point(total_insets.left, total_insets.top),
            baseline: baseline,
            visualStyle: this.settings.visualStyle,
            children: nodes,
            padding: this.settings.padding,
            margin: this.settings.margin,
            borderWidth: this.settings.borderWidth,
            shadow: this.settings.shadow,
        })
    }
}

class TextInputElement implements GElement {
    private settings: TextInputRequirements

    constructor(opts: TextInputSettings) {
        this.settings = {
            ...opts,
            multiline: opts.multiline?opts.multiline:false,
            borderWidth: withInsets(1),
            margin: Style.buttonMargin,
            padding: Style.buttonPadding,
        }
    }

    layout(rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        // console.log("redoing layout",this.opts.text)
        const cache:StateCache = MGlobals.get(STATE_CACHE)
        cache.startLayout(this.settings.inputid)
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
            text:this.settings.text,
            multiline: this.settings.multiline,
        })
        let text_node = text.layout(rc,_cons)
        const cursor_node = this.makeCursor()

        rc.ctx.font = Style.font
        let lines = this.settings.text.split("\n")
        let line = lines[cursorPosition.y]
        let text_before = line.substring(0,cursorPosition.x)
        // console.log("text before is",text_before, this.opts.cursorPosition)
        let metrics = rc.ctx.measureText(text_before)
        let baseline = metrics.fontBoundingBoxAscent
        let total_insets = addInsets(addInsets(this.settings.margin, this.settings.borderWidth), this.settings.padding)
        text_node.settings.pos.x = total_insets.left
        text_node.settings.pos.y = total_insets.top

        cursor_node.settings.pos.x = total_insets.left + metrics.width
        cursor_node.settings.pos.y = total_insets.top + cursorPosition.y * baseline
        cursor_node.settings.size.h = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
        const size = new Size(100,100)
        size.h = total_insets.top + text_node.settings.size.h + total_insets.bottom
        let node = new GRenderNode({
            id: 'text-input-node',
            inputid: this.settings.inputid,
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
            baseline: baseline,
            borderWidth: withInsets(1),
            children: [text_node,cursor_node],
            contentOffset: new Point(total_insets.left, total_insets.top),
            font: Style.font,
            margin: this.settings.margin,
            padding: this.settings.padding,
            pos: new Point(0, 0),
            size: size,
            clip: true,
            handleEvent: (e) => {
                if (e.type === 'keyboard-typed') {
                    let kbe = e as MKeyboardEvent;
                    let t2 = processText(this.settings.text,cursorPosition,kbe)
                    setCursorPosition(t2[1])
                    if(this.settings.onChange)this.settings.onChange(t2, e)
                    e.redraw()
                }
            }
        })

        cache.endLayout(this.settings.inputid)
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


export function Label(opts: { text: string, shadow?: boolean, multiline?:boolean }) {
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
        shadow: opts.shadow ? opts.shadow : false,
        multiline: opts.multiline ? opts.multiline : false
    })
}
