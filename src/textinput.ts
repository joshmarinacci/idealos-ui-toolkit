import {
    CEvent,
    ElementSettings,
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
import {ACTION_MAP, KeyActionArgs, META_KEYS, TextSelection} from "./actions.js";
import {getTotalInsets} from "./util.js";
import {TextElement} from "./text.js";


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
    console.log("doing selection forward char")
    let model = new TextModel(args.text)
    let sel = args.selection
    if(sel.isActive()) {
        sel = sel.extendRight(1)
        return {
            text:model.toText(),
            pos:sel.getEnd(),
            selection:sel
        }

    } else {
        sel = sel.makeAt(args.pos)
        let pos = args.pos.add(new Point(1, 0))
        return {
            text:model.toText(),
            pos:pos,
            selection:sel
        }
    }
})
ACTION_MAP.addAction('selection-backward-char', (args:KeyActionArgs) => {
    console.log("doing selection backward char")
    let model = new TextModel(args.text)
    let sel = args.selection
    if(sel.isActive()) {
        sel = sel.extendLeft(1)
        return {
            text:model.toText(),
            pos:sel.getStart(),
            selection:sel
        }

    } else {
        let pos = args.pos.subtract(new Point(1, 0))
        sel = sel.makeAt(pos)
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
        selection:args.selection,
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
        selection:args.selection,
        pos:pos
    }
})
ACTION_MAP.addAction('delete-backward',(args:KeyActionArgs) => {
    let model = new TextModel(args.text)
    let pos = args.pos.copy()
    let sel = args.selection
    if(sel.isActive()) {
        model.deleteCharsAt(args.selection)
        pos = args.selection.start.copy()
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
        model.deleteCharsAt(args.selection)
        pos = args.selection.start.copy()
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
    if(key === 'space') key = ' '
    let sel = args.selection
    if(sel.isActive()) {
        model.deleteCharsAt(sel)
        pos = sel.getStart()
        sel = TextSelection.makeInactive()
    }
    model.insertCharAt(pos,key)
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
        selection:TextSelection.makeWith(start,end)
    }
})


type OnChangeCallback<T> = (value: T, e: CEvent) => void
export type TextInputElementSettings = {
    text?: StateHandler<string>
    onChange?: OnChangeCallback<[string, Point]>
    multiline: boolean
    fixedWidth?: number,
    fixedHeight?: number,
} & ElementSettings

export class TextModel {
    private readonly lines: string[];

    constructor(text: string) {
        this.lines = text.split('\n')
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
        let line = this.lines[selection.start.y]
        let before = line.substring(0, selection.start.x)
        let after = line.substring(selection.end.x)
        line = before + after
        this.lines[selection.start.y] = line
    }
}

function processText(text: string, cursorPosition: Point, kbe: MKeyboardEvent, selection: TextSelection): [string, Point, TextSelection] {
    if (META_KEYS.includes(kbe.key)) return [text, cursorPosition, selection]
    let action_name = ACTION_MAP.match(kbe)
    // console.log('TEXT_INPUT: action:',action_name, 'pos',cursorPosition, 'sel',selection)
    if (action_name) {
        let action_impl = ACTION_MAP.actions.get(action_name)
        if (action_impl) {
            let res = ACTION_MAP.actions.get(action_name)({text, pos: cursorPosition, selection:selection})
            return [res.text, res.pos, res.selection]
        } else {
            console.warn(`missing action for '${action_name}'`)
        }
    }
    let res = ACTION_MAP.actions.get('insert-character')({text, pos: cursorPosition, key: kbe.key, selection:selection})
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
            total_insets.top + cursorPosition.y * baseline
        )
        cursor_node.settings.size.h = metrics_before.h
        const size = new Size(100, 100)
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

        const selection_rect = this.makeSelection()
        if(selection.isActive()) {
            selection_rect.settings.pos = new Point(total_insets.left, total_insets.top)
            // console.log("measuring",line.length, line)
            let before_text = line.substring(0,selection.start.x)
            let selected_text = line.substring(selection.start.x, selection.end.x)
            // console.log('before text',before_text)
            // console.log("selected text", selected_text)
            let [before_metrics] = this.calcMetrics(rc, before_text )
            // console.log("before metrics",before_metrics)
            let [selected_metrics] = this.calcMetrics(rc, selected_text )
            // console.log("selected metrics", selected_metrics)
            selection_rect.settings.pos = selection_rect.settings.pos.add(new Point(before_metrics.w,0))
            selection_rect.settings.size = new Size(selected_metrics.w, selected_metrics.h)
            // console.log(selection_rect)
        } else {
            selection_rect.settings.visualStyle.background = TRANSPARENT
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
            children: [selection_rect, text_node, cursor_node],
            contentOffset: new Point(total_insets.left, total_insets.top),
            font: Style.base().font,
            padding: this.settings.padding,
            pos: new Point(0, 0),
            size: size,
            clip: false,
            handleEvent: (e) => {
                if (e.type === 'keyboard-typed') {
                    if (!focused) setFocused(true)
                    let kbe = e as MKeyboardEvent;
                    let t2 = processText(textString, cursorPosition, kbe, selection)
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

    private makeSelection() {
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
