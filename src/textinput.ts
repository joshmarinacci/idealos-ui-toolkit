import {
    CEvent,
    ElementSettings,
    FontSettings,
    GElement,
    GRenderNode,
    LayoutConstraints,
    MKeyboardEvent,
    StateHandler,
    TRANSPARENT,
    useState,
    ZERO_INSETS,
    ZERO_POINT
} from "./base.js";
import {Insets, Point, Size} from "josh_js_util";
import {Style} from "./style.js";
import {RenderContext} from "./gfx.js";
import {KEY_VENDOR} from "./keys.js";
import {ACTION_MAP, ActionMap, KeyActionArgs, KeyboardModifiers, TextSelection} from "./actions.js";
import {getTotalInsets} from "./util.js";
import {TextElement} from "./text.js";
import {LOGICAL_KEYBOARD_CODE, LOGICAL_KEYBOARD_CODE_TO_CHAR, LogicalKeyboardCode, META_KEYS} from "./keyboard.js";
import {HBox, VBox} from "./layout.js";
import {IconButton} from "./buttons.js";
import {Icons} from "./icons.js";


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
        selection:args.selection.clear()
    }
})
ACTION_MAP.addAction("cursor-line-start",(args:KeyActionArgs) => {
    // let model = new TextModel(args.text)
    let pos = new Point(0,args.pos.y)
    return {
        text:args.text,
        pos:pos,
        selection:args.selection.clear()
    }
})
ACTION_MAP.addAction("cursor-line-end",(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let len = model.lineLengthAt(args.pos)
    let pos = new Point(len,args.pos.y)
    return {
        text:args.text,
        pos:pos,
        selection:args.selection.clear()
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
        pos:pos,
        selection:args.selection.clear(),
    }
})
ACTION_MAP.addAction('selection-forward-char', (args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let sel = args.selection
    if(sel.isActive()) {
        sel = sel.extendRight(1)
        return {
            text:model.toText(),
            pos:model.indexToPos(sel.getEnd()),
            selection:sel
        }

    } else {
        sel = sel.makeAt(model.posToIndex(args.pos))
        let pos = args.pos.add(new Point(1, 0))
        return {
            text:model.toText(),
            pos:pos,
            selection:sel
        }
    }
})
ACTION_MAP.addAction('selection-backward-char', (args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let sel = args.selection
    if(sel.isActive()) {
        sel = sel.extendLeft(1)
        return {
            text:model.toText(),
            pos:model.indexToPos(sel.getStart()),
            selection:sel
        }
    } else {
        let pos = args.pos.subtract(new Point(1, 0))
        sel = sel.makeAt(model.posToIndex(pos))
        return {
            text:model.toText(),
            pos:pos,
            selection:sel
        }
    }
})
ACTION_MAP.addAction('selection-prev-line',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let sel = args.selection
    let pos = args.pos.copy()
    if(pos.y > 0) {
        pos.y -= 1
    }
    if(sel.isActive()) {
        sel = new TextSelection(model.posToIndex(pos),sel.end,true)
        return {
            text:model.toText(),
            pos:pos,
            selection:sel
        }
    } else {
        sel = new TextSelection(model.posToIndex(pos), model.posToIndex(args.pos),true)
        return {
            text:model.toText(),
            pos:pos,
            selection:sel
        }
    }
})
ACTION_MAP.addAction('selection-next-line',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let sel = args.selection
    let pos = args.pos.copy()
    if(pos.y < model.lineCount()-1) {
        pos.y += 1
    }
    if(sel.isActive()) {
        sel = new TextSelection(sel.start,model.posToIndex(pos),true)
        return {
            text:model.toText(),
            pos:pos,
            selection:sel
        }
    } else {
        sel = new TextSelection(model.posToIndex(args.pos), model.posToIndex(pos),true)
        return {
            text:model.toText(),
            pos:pos,
            selection:sel
        }
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
        pos:pos,
        selection:args.selection.clear()
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
        selection:args.selection.clear(),
        pos:pos
    }
})
ACTION_MAP.addAction('delete-backward',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let pos = args.pos.copy()
    let sel = args.selection
    if(sel.isActive()) {
        model.deleteCharsAt(args.selection)
        pos = model.indexToPos(args.selection.start)
        sel = TextSelection.makeInactive()
    } else {
        if (pos.x > 0) {
            model.deleteCharAt(pos)
            pos.x -= 1
        }
        if (pos.x === 0 && pos.y > 0) {
            pos.y -= 1
            pos.x = model.lineLengthAt(pos)
            model.mergeLineAt(pos)
        }
    }
    return {
        text:model.toText(),
        selection:sel,
        pos:pos
    }

})
ACTION_MAP.addAction('delete-forward',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let pos = args.pos.copy()
    let sel = args.selection
    if(sel.isActive()) {
        model.deleteCharsAt(sel)
        pos = model.indexToPos(sel.start)
        sel = TextSelection.makeInactive()
    } else {
        let p2 = pos.add(new Point(1, 0))
        if (pos.x < model.lineLengthAt(p2)) {
            model.deleteCharAt(p2)
        }
        if (pos.x == model.lineLengthAt(p2) && pos.y < model.lineCount() - 1) {
            model.mergeLineAt(p2)
        }
    }
    return {
        text:model.toText(),
        selection:sel,
        pos:pos
    }
})
ACTION_MAP.addAction('insert-character',(args:KeyActionArgs)=> {
    let model = new TextModel(args.text)
    let pos = args.pos.copy()
    let key = args.key
    // console.log("key is",key)
    let char = LOGICAL_KEYBOARD_CODE_TO_CHAR[key]
    if(!char) {
        console.warn(`missing char for key ${key}`)
        return args
    }
    if(args.mods.shift) {
        char = char.toUpperCase()
    }
    // console.log("char is",char)
    let sel = args.selection
    if(sel.isActive()) {
        model.deleteCharsAt(sel)
        pos = model.indexToPos(sel.getStart())
        sel = TextSelection.makeInactive()
    }
    model.insertCharAt(pos,char)
    return {
        text:model.toText(),
        selection:sel,
        pos:new Point(pos.x+1,pos.y)
    }
})
ACTION_MAP.addAction('insert-newline', (args) => {
    let model = new TextModel(args.text)
    model.splitLineAt(args.pos)
    let pos = new Point(0,args.pos.y+1)
    return {
        text:model.toText(),
        pos:pos,
        selection:args.selection,
    }
})
ACTION_MAP.addAction('select-all',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let start = new Point(0,0)
    let end = new Point(model.lineLengthAt(new Point(0,model.lineCount()-1)),model.lineCount()-1)
    return {
        text:model.toText(),
        pos:args.pos,
        selection:TextSelection.makeWith(0,model.lastIndex())
    }
})

const NUMBER_ACTION_MAP = new ActionMap(ACTION_MAP)

function isDigit(key: LogicalKeyboardCode) {
    if (key === LOGICAL_KEYBOARD_CODE.DIGIT_1) return true
    if (key === LOGICAL_KEYBOARD_CODE.DIGIT_2) return true
    if (key === LOGICAL_KEYBOARD_CODE.DIGIT_3) return true
    if (key === LOGICAL_KEYBOARD_CODE.DIGIT_4) return true
    if (key === LOGICAL_KEYBOARD_CODE.DIGIT_5) return true
    if (key === LOGICAL_KEYBOARD_CODE.DIGIT_6) return true
    if (key === LOGICAL_KEYBOARD_CODE.DIGIT_7) return true
    if (key === LOGICAL_KEYBOARD_CODE.DIGIT_8) return true
    if (key === LOGICAL_KEYBOARD_CODE.DIGIT_9) return true
    if (key === LOGICAL_KEYBOARD_CODE.DIGIT_0) return true
    return false
}

NUMBER_ACTION_MAP.addAction('insert-character',(args:KeyActionArgs) => {
    // console.log("key is",args.key)
    if(isDigit(args.key)) return args.delegate(args)
    if(args.key === LOGICAL_KEYBOARD_CODE.BACKSPACE) return args.delegate(args)
    return {text:args.text, pos:args.pos,selection: args.selection}
})


type OnChangeCallback<T> = (value: T, e: CEvent) => void
export type TextInputElementSettings = {
    text?: StateHandler<string>
    onChange?: OnChangeCallback<[string, Point]>
    multiline?: boolean
    fixedWidth?: number,
    fixedHeight?: number,
    actionMap?:ActionMap,
} & ElementSettings

export class TextModel {
    private lines: string[];
    private text: string;

    constructor(text: string) {
        this.lines = text.split('\n')
        this.text = text
    }
    private _resplit() {
        this.lines = this.text.split('\n')
    }

    splitLineAt(pos: Point) {
        let line = this.lines[pos.y]
        let before = line.substring(0, pos.x)
        let after = line.substring(pos.x)
        this.lines.splice(pos.y, 1, before, after)
    }

    mergeLineAt(pos: Point) {
        let line = this.lines[pos.y]
        let line2 = this.lines[pos.y + 1]
        let newLine = line + line2
        this.lines.splice(pos.y, 2, newLine)
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
        let char = line.substring(pos.x - 1, pos.x)
        let before = line.substring(0, pos.x - 1)
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

    deleteCharsAt(selection: TextSelection) {
        let before = this.text.substring(0, selection.start)
        let after = this.text.substring(selection.end)
        this.text = before + after
        // console.log("deleting",selection,`becomes -${before}-${after}-`)
        this._resplit()
    }

    posToIndex(pos: Point):number {
        let n = 0
        for(let j=0; j<pos.y; j++) {
            let line = this.lines[j]
            n += line.length
        }
        n += pos.x
        return n
    }

    indexToPos(ch: number) {
        let x = 0
        let y = 0
        for(let j=0; j<this.lines.length; j++) {
            let line = this.lines[j]
            if(ch > line.length) {
                ch -= line.length
                y += 1
            } else {
                x = ch
            }
        }
        return new Point(x,y)
    }

    lastIndex() {
        return this.text.length
    }

    lineAt(y: number) {
        return this.lines[y]
    }
}

function processText(actionMap:ActionMap, text: string, pos: Point, kbe: MKeyboardEvent, selection: TextSelection): [string, Point, TextSelection] {
    if (META_KEYS.includes(kbe.key)) return [text, pos, selection]
    const mods:KeyboardModifiers = {
        shift: kbe.shift,
        alt: kbe.alt,
        meta: kbe.meta,
        control: kbe.control
    }
    const key = kbe.key
    let action_name = actionMap.match(kbe)
    // console.log('TEXT_INPUT: action:',action_name, 'pos',pos, 'sel',selection)
    if (action_name) {
        let action_impl = actionMap.getAction(action_name)
        // console.log("TEXT_INPUT: ",action_name)
        if (action_impl) {
            let res = action_impl({text, pos, key, selection, mods})
            return [res.text, res.pos, res.selection]
        } else {
            console.warn(`missing action for '${action_name}'`)
        }
    }
    let res = actionMap.doAction('insert-character',text,pos,kbe,selection,mods)
    return [res.text, res.pos, res.selection]
}

export class TextInputElement implements GElement {
    private readonly settings: TextInputElementSettings

    constructor(opts: TextInputElementSettings) {
        this.settings = {
            ...opts,
            multiline: opts.multiline ? opts.multiline : false,
            borderWidth: Insets.from(1),
            padding: Style.button().padding,
            fontSettings: opts.fontSettings || {
                font: Style.base().font,
                fontSize: Style.base().fontSize,
                fontWeight: Style.base().fontWeight,
            },
            actionMap:opts.actionMap || ACTION_MAP
        }
    }

    private calcMetrics(rc: RenderContext, text: string): [Size, number] {
        return rc.surface.measureText(text, {
            fontSize: this.settings.fontSettings?.fontSize,
            fontFamily: this.settings.fontSettings?.font
        })
    }

    layout(rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        const key = KEY_VENDOR.getKey()
        let [textString, setText] = useState(key, "text", this.settings.text, () => "")
        let [cursorPosition, setCursorPosition] = useState(key, "cursor", undefined, () => new Point(0, 0))
        let [focused, setFocused] = useState(key, "focused", undefined, () => false)
        let [selection, setSelection] = useState(key, "selection", undefined, () => TextSelection.makeInactive())

        let text = new TextElement({
            borderWidth: ZERO_INSETS,
            fontSettings: {
                font: this.settings.fontSettings?.font,
                fontSize: this.settings.fontSettings?.fontSize,
                fontWeight: Style.base().fontWeight,
            },
            padding: ZERO_INSETS,
            shadow: true,
            visualStyle: {
                textColor: Style.base().textColor,
                background: TRANSPARENT,
                borderColor: TRANSPARENT,
            },
            text: textString,
            multiline: this.settings.multiline,
        })
        let text_node = text.layout(rc, _cons)
        const cursor_node = this.makeCursor()

        let lines = textString.split("\n")
        let line = lines[cursorPosition.y]
        let text_before = line.substring(0, cursorPosition.x)
        let [metrics_before, baseline] = this.calcMetrics(rc, text_before)
        let total_insets = getTotalInsets(this.settings)
        text_node.settings.pos = new Point(total_insets.left, total_insets.top)

        cursor_node.settings.pos = new Point(
            total_insets.left + metrics_before.w,
            total_insets.top + cursorPosition.y * metrics_before.h
        )
        cursor_node.settings.size.h = metrics_before.h
        const size = new Size(_cons.space.w, 100)
        if (this.settings.fixedWidth) {
            size.w = this.settings.fixedWidth
        }
        if (this.settings.fixedHeight) {
            size.h = this.settings.fixedHeight
        } else {
            size.h = total_insets.top + text_node.settings.size.h + total_insets.bottom
        }
        if(!selection) {
            console.warn("selection is empty")
        } else {
            // console.log("selection is", selection.start, selection.end)
        }

        const children = [text_node]

        if(selection.isActive()) {
            console.log("rendering selection",selection)
            let model = new TextModel(textString)
            let s_sta = model.indexToPos(selection.getStart())
            let s_end = model.indexToPos(selection.getEnd())
            // console.log("start",s_sta,'end',s_end)
            if(s_sta.y === s_end.y) {
                // console.log("single line selection")
                const line = model.lineAt(s_sta.y)
                const srect = this.makeSelectionRect()
                srect.settings.pos = new Point(total_insets.left, total_insets.top)
                let before_text = line.substring(0,s_sta.x)
                let selected_text = line.substring(s_sta.x,s_end.x)
                // console.log(`before text -${before_text}-`)
                // console.log(`after text -${selected_text}-`)
                let [before_metrics] = this.calcMetrics(rc, before_text )
                let [selected_metrics] = this.calcMetrics(rc, selected_text )
                srect.settings.pos = srect.settings.pos.add(new Point(
                    before_metrics.w,
                    selected_metrics.h*s_sta.y))
                srect.settings.size = new Size(selected_metrics.w, selected_metrics.h)
                // console.log("srect",srect.settings.pos)
                // console.log("srect",srect.settings.size)
                children.unshift(srect)
            } else {
                // start_sel
                {
                    const rect = this.makeSelectionRect()
                    let before_text = model.lineAt(s_sta.y).substring(0, s_sta.x)
                    let after_text = model.lineAt(s_sta.y).substring(s_sta.x)
                    let [before_metrics] = this.calcMetrics(rc, before_text)
                    rect.settings.pos = new Point(
                        total_insets.left + before_metrics.w,
                        total_insets.top + before_metrics.h*s_sta.y
                    )
                    let [selected_metrics] = this.calcMetrics(rc, after_text)
                    rect.settings.size = new Size(selected_metrics.w, selected_metrics.h)
                    children.unshift(rect)
                }
                // middle lines
                {
                    if((s_end.y - s_sta.y) > 1) {
                        // console.log('middle lines')
                        for(let j=s_sta.y+1; j<s_end.y; j++) {
                            // console.log("middle line",j)
                            const line = model.lineAt(j)
                            const [line_metrics] = this.calcMetrics(rc,line)
                            const rect = this.makeSelectionRect()
                            rect.settings.pos = new Point(
                                total_insets.left,
                                total_insets.top + line_metrics.h*j
                            )
                            rect.settings.size = line_metrics
                            // console.log("line is",line)
                            children.unshift(rect)
                        }
                    }
                }
                // end_sel
                {
                    const rect = this.makeSelectionRect()
                    let before_text = model.lineAt(s_end.y).substring(0, s_end.x)
                    let after_text = model.lineAt(s_end.y).substring(s_end.x)
                    let [before_metrics] = this.calcMetrics(rc, before_text)
                    rect.settings.pos = new Point(total_insets.left,
                        total_insets.top + before_metrics.h*s_end.y
                    )
                    rect.settings.size = new Size(before_metrics.w,before_metrics.h)
                    children.unshift(rect)
                }
            }
        }

        if(focused) {
            children.push(cursor_node)
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
            key: key,
            text: "",
            visualStyle: visualStyle,
            focusedStyle: focusedStyle,
            baseline: baseline,
            borderWidth: Insets.from(1),
            children: children,
            contentOffset: new Point(total_insets.left, total_insets.top),
            font: Style.base().font,
            padding: this.settings.padding,
            pos: new Point(0, 0),
            size: size,
            clip: false,
            handleEvent: (e) => {
                if (e.type === 'mouse-down') {
                    if (!focused) setFocused(true)
                    e.use()
                    e.redraw()
                }
                if (e.type === 'keyboard-typed') {
                    if (!focused) setFocused(true)
                    let kbe = e as MKeyboardEvent;
                    let t2 = processText(
                        (this.settings.actionMap || ACTION_MAP),
                        textString, cursorPosition, kbe, selection)
                    setText(t2[0])
                    setCursorPosition(t2[1])
                    setSelection(t2[2])
                    e.use()
                    e.redraw()
                }
            }
        })
    }

    private makeCursor() {
        const key = KEY_VENDOR.getKey()
        return new GRenderNode({
            key: key,
            children: [],
            contentOffset: new Point(5, 5),
            font: Style.base().font,
            kind: "",
            pos: ZERO_POINT.copy(),
            size: new Size(2, 50),
            text: 'hithere',
            padding: ZERO_INSETS,
            borderWidth: ZERO_INSETS,
            visualStyle: {
                background: 'red',
                borderColor: 'blue',
                textColor: TRANSPARENT,
            },
            shadow: true,
            baseline: 0

        })
    }

    private makeSelectionRect() {
        const key = KEY_VENDOR.getKey()
        return new GRenderNode({
            key: key,
            children: [],
            font: Style.base().font,
            contentOffset: new Point(0, 0),
            kind: "selection-rect",
            pos: ZERO_POINT.copy(),
            size: new Size(10, 10),
            padding: ZERO_INSETS,
            borderWidth: Insets.from(1),
            visualStyle: {
                background: 'aqua',
                borderColor: TRANSPARENT,
                textColor: TRANSPARENT,
            },
            shadow: true,
            baseline: 0,
        })
    }
}

export function TextBox(param: TextInputElementSettings): GElement {
    return new TextInputElement(param)
}
export type NumberBoxSettings = {
    value: number,
    fixedWidth?:number,
    fontSettings?: FontSettings
}
export function NumberBox(param: NumberBoxSettings):GElement {
    const key = KEY_VENDOR.getKey()
    let [value, setValue] = useState(key, "num", undefined, () => 0)
    const input = new TextInputElement({
            // fixedWidth:param.fixedWidth,
            fontSettings: param.fontSettings,
            actionMap:NUMBER_ACTION_MAP,
            text: {
                get:() => value+"",
                set:(v) => {
                    let vv = parseInt(v)
                    if(isNaN(vv)) vv = 0
                    setValue(vv)
                }
            }
        })
    const increment = (e:CEvent) => {
        if(e.type === 'mouse-down') {
            setValue(value+1)
            e.redraw()
        }
    }
    const decrement = (e:CEvent) => {
        if(e.type === 'mouse-down') {
            setValue(value-1)
            e.redraw()
        }
    }
    return HBox({
        fixedWidth: param.fixedWidth,
        mainAxisSelfLayout:'grow',
        crossAxisSelfLayout:'shrink',
        children:[
            input,
            VBox({
                children:[
                    IconButton({
                        padding: Insets.from(1),
                        fontSettings: {
                            fontSize: 10,
                        },
                        icon:Icons.KeyboardArrowUp, handleEvent:(increment)
                    }),
                    IconButton({
                        padding: Insets.from(1),
                        fontSettings: {
                            fontSize: 10,
                        },
                        icon:Icons.KeyboardArrowDown, handleEvent:(decrement)
                    }),
            ]}),
    ]})
}
