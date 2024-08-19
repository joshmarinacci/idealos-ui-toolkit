import {CEvent, GElement, GRenderNode, LayoutConstraints, MKeyboardEvent, TRANSPARENT, ZERO_INSETS, ZERO_POINT} from "./base.ts";
import {RenderContext, sizeWithPadding, withInsets} from "./gfx.ts";
import {Style} from "./style.ts";
import {Insets, Point, Size} from "josh_js_util";
import {addInsets} from "./util.ts";
import {TextElement} from "./comps2.ts";

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

function processText(text: string, cursorPosition: Point, kbe: MKeyboardEvent):[string, Point] {
    if(META_KEYS.includes(kbe.key)) return [text,cursorPosition]
    if(kbe.key === 'ArrowLeft') {
        cursorPosition = cursorPosition.subtract(new Point(1,0))
        return [text,cursorPosition]
    }
    if(kbe.key === 'ArrowRight') {
        cursorPosition = cursorPosition.add(new Point(1,0))
        return [text,cursorPosition]
    }

    if(kbe.key === 'Backspace') {
        if(text.length > 0) {
            let text2 = text.substring(0,cursorPosition.x-1)
            let text3 = text.substring(cursorPosition.x)
            let cp = cursorPosition.copy()
            cp.x -= 1
            return [text2 + text3, cp]
        } else {
            return [text,cursorPosition]
        }
    }
    {
        let text2 = text.substring(0, cursorPosition.x)
        let text3 = text.substring(cursorPosition.x)
        let cp = cursorPosition.copy()
        cp.x += 1
        return [text2 + kbe.key + text3, cp]
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
        let text_before = this.opts.text.substring(0,this.opts.cursorPosition.x)
        // console.log("text before is",text_before, this.opts.cursorPosition)
        let metrics = rc.ctx.measureText(text_before)
        let total_insets = addInsets(addInsets(this.opts.margin, this.opts.borderWidth), this.opts.padding)
        text_node.settings.pos.x = total_insets.left
        text_node.settings.pos.y = total_insets.top

        cursor_node.settings.pos.x = metrics.width + total_insets.left
        cursor_node.settings.pos.y = total_insets.top
        cursor_node.settings.size.h = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
        const size = new Size(200,100)
        return new GRenderNode({
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
                    this.opts.onChange(processText(this.opts.text,this.opts.cursorPosition,kbe), e)
                }
            }
        })
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
    return new TextInputElement(param)
}













