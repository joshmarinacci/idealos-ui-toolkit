import {Bounds, Insets, Point, Size} from "josh_js_util"
import {Icons} from "./icons.ts";

export type RenderParameters = {
    ctx: CanvasRenderingContext2D
    fontSize: string
    debug: boolean
}


const hue = 32
const StyleVars = {
    color: 'black',
    borderColor: 'black',
    fontSize: '16px',
    fontFamily: 'sans-serif',
    margin: new Insets(4, 4, 4, 4),
    padding: new Insets(8, 8, 8, 8),
    background: `hsl(${hue},5%,100%)`,
    selectedBackground: `hsl(${hue},90%,57%)`,
    borderRadius: '4px',
    borderWidth: 1,
    panelBackgroundColor: `hsl(${hue}, 5%, 100%)`,

    controlBackgroundColor: `hsl(${hue}, 5%, 100%)`,
    controlPadding: 8,
    controlMargin: 4,
    controlFontFamily: 'sans-serif',
    controlFontSize: '16px',
    controlTextColor: 'black',
    controlBorderWidth: '1px',
    controlBorderColor: `hsl(${hue}, 0%, 10%)`,

    selectedControlBackground: `hsl(${hue}, 90%, 57%)`,
}
export type Border = {
    width: number,
    color: string
}


export type VBlock = {
    text?: string,
    bounds: Bounds,
    margin?: Insets,
    border?: Border,
    padding?: Insets,

    icon?: Icons
    children?: VBlock[]

    baseline: number,
    background?: string
    color?: string
}

function addInsets(bounds: Bounds, padding: Insets): Bounds {
    return new Bounds(bounds.x, bounds.y, bounds.w + padding.left + padding.right, bounds.h + padding.top + padding.bottom)
}

type ShrinkBoxParamters = {
    margin?:Insets,
    border?:Border,
    padding?:Insets
}
export function ShrinkBox(c:RenderParameters, children:VBlock[], opts?:ShrinkBoxParamters):VBlock {
    let margin = new Insets(0,0,0,0)
    let padding = new Insets(0,0,0,0)
    if(opts) {
        if(opts.margin) margin = opts.margin
        if(opts.padding) padding = opts.padding
    }


    let bounds = new Bounds(0,0,0,0)
    bounds = addInsets(bounds,margin)
    bounds = addInsets(bounds,padding)

    let inner = new Bounds(0,0,0,0)
    for(let ch of children) {
        if(ch.bounds.h > inner.h) inner.h = ch.bounds.h
        ch.bounds.x += margin.left
        ch.bounds.y += margin.top
        ch.bounds.x = inner.w
        inner.w += ch.bounds.w
    }
    bounds.h += inner.h
    bounds.w += inner.w

    return {
        baseline: 0,
        bounds:bounds,
        padding:padding,
        margin:margin,
        children:children,
        border:{
            width: 1,
            color:'purple'
        }
    }
}

type ButtonOpts = {
    text:string,
    selected:boolean
}
export function Button(c: RenderParameters, opts: ButtonOpts): VBlock {
    return ShrinkBox(c,[Label(c,opts.text)],{
        // margin: StyleVars.margin,
        border: {
            width:StyleVars.borderWidth,
            color: StyleVars.borderColor,
        },
        // padding:StyleVars.padding,
    })
}


export function Checkbox(c: RenderParameters, text: string, b: boolean) {
    return ShrinkBox(c, [
        Icon(c,{icon:b?Icons.CheckboxChecked:Icons.CheckboxUnchecked}),
        Label(c, text)
    ])
}

export function RadioButton(c: RenderParameters, text: string, b: boolean) {
    return ShrinkBox(c, [
        Icon(c,{icon:b?Icons.RadioButtonChecked:Icons.RadioButtonUnchecked}),
        Label(c, text)
    ])
}

export function Label(c: RenderParameters, text: string): VBlock {
    const m = c.ctx.measureText(text)
    let bounds = new Bounds(0, 0, m.width, m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)
    // console.log('metrics',text,m)
    bounds = addInsets(bounds, StyleVars.padding)
    bounds = addInsets(bounds, StyleVars.margin)
    return {
        text: text,
        bounds: bounds,
        children: [],
        baseline: m.fontBoundingBoxAscent,
        padding: StyleVars.padding,
        margin: StyleVars.margin,
    }
}

export function ToggleButton(c: RenderParameters, opts: { text: string; selected: boolean }): VBlock {
    if (opts.selected) {
        return Button(c, opts.text)
    } else {
        return Button(c, opts.text)
    }

}


type IconParameters = {
    icon: Icons
    color?: string
}
type TextInputParameters = {
    placeholder: string
}

export function FixedBox(c: RenderParameters,
                         child:VBlock,
                         opts:{size:Size, border:Border}): VBlock {
    return {
        baseline:0,
        bounds: new Bounds(0,0,opts.size.w,opts.size.h),
        children:[child],
        border: opts.border,
    }
}
export function TextInput(c: RenderParameters, opts: TextInputParameters): VBlock {
    return FixedBox(c,
        Label(c, opts.placeholder)
    ,{
        size:new Size(100,32),
        border: {
            width: StyleVars.borderWidth,
            color: StyleVars.borderColor,
        }
    })
}

export function NumberInput(c: RenderParameters, opts: TextInputParameters) {
    return TextInput(c, opts)
}

export function SearchInput(c: RenderParameters, opts: TextInputParameters) {
    return TextInput(c, opts)
}

export function IconButton(c: RenderParameters, opts: { icon: Icons; text?: string }): VBlock {
    const ch = [Icon(c, {icon: opts.icon})]
    if (opts.text) ch.push(Label(c, opts.text))
    return ShrinkBox(c, ch, {
        border: {
            color: StyleVars.borderColor,
            width: 1
        }
    })
}

export function Icon(_c: RenderParameters, opts: IconParameters): VBlock {
    return {
        bounds: new Bounds(0, 0, 32, 32),
        baseline: 17,
        icon: opts.icon,
        padding: StyleVars.padding,
        margin: StyleVars.padding,
        color: opts.color
    }
}

export function Separator(_c: RenderParameters): VBlock {
    return {
        bounds: new Bounds(0, 0, 20, 30),
        margin: new Insets(5,5,5,5),
        background: "red",
        baseline: 0
    }
}

export function VBox(_c: RenderParameters, vBlocks: VBlock[]): VBlock {
    let bounds = new Bounds(0, 0, 0, 0)
    for (let ch of vBlocks) {
        if (ch.bounds.w > bounds.w) {
            bounds.w = ch.bounds.w
        }
        ch.bounds.y += bounds.h
        bounds.h += ch.bounds.h
    }
    bounds = bounds.grow(1)
    return {
        // text: undefined,
        bounds: bounds,
        children: vBlocks,
        baseline: 0,
    }
}

type BoxParameters = {
    border: Border
    padding?:Insets
    margin?:Insets
    background?:string
}

export function HBox(_c: RenderParameters, children: VBlock[], opts?: BoxParameters): VBlock {
    let bounds = new Bounds(0, 0, 0, 0)
    if (opts && opts.border) {
        bounds.w += opts.border.width * 2
        bounds.h += opts.border.width * 2
    }
    if(opts && opts.padding) {
        bounds.w += opts.padding.left + opts.padding.right
        bounds.h += opts.padding.top + opts.padding.bottom
    }
    if(opts && opts.margin) {
        bounds.w += opts.margin.left + opts.margin.right
        bounds.h += opts.margin.top + opts.margin.bottom
    }
    let pt = new Point(bounds.x, bounds.y).add(new Point(2, 2))
    for (let ch of children) {
        ch.bounds.x = pt.x
        ch.bounds.y = pt.y
        pt.x += ch.bounds.w
        bounds.w += ch.bounds.w
        bounds.h = Math.max(bounds.h, ch.bounds.h)
    }
    bounds = bounds.grow(1)
    return {
        bounds: bounds,
        children: children,
        baseline: bounds.h,
        border: opts?.border,
        padding: opts?.padding,
        margin: opts?.margin,
    }

}

export function drawBlock(c: RenderParameters, block: VBlock) {
    c.ctx.save()
    // if (c.debug) {
    //     c.ctx.lineWidth = 0.5
    //     c.ctx.strokeStyle = 'purple'
    //     c.ctx.strokeRect(block.bounds.x, block.bounds.y, block.bounds.w, block.bounds.h)
    // }
    c.ctx.translate(block.bounds.x, block.bounds.y)
    if (block.margin) {
        c.ctx.translate(block.margin.left, block.margin.top)
    }
    if (block.background) {
        c.ctx.fillStyle = block.background
        c.ctx.fillRect(0, 0, block.bounds.w, block.bounds.h)
    }
    if (block.border) {
        c.ctx.strokeStyle = block.border.color
        c.ctx.lineWidth = block.border.width
        c.ctx.strokeRect(0, 0, block.bounds.w, block.bounds.h)
        c.ctx.translate(block.border.width, block.border.width)
    }
    if (block.padding) {
        c.ctx.translate(block.padding.left, block.padding.top)
    }
    c.ctx.fillStyle = 'black'
    if (block.color) {
        c.ctx.fillStyle = block.color
    }
    if (block.text) {
        c.ctx.fillText(block.text, 0, block.baseline)
    }
    if (block.icon) {
        c.ctx.font = '24px material-icons'
        c.ctx.fillStyle = (block.color ? block.color : 'black')
        c.ctx.fillText(block.icon, 0, block.baseline)
    }
    // draw the baseline
    // c.ctx.strokeStyle = 'purple'
    // c.ctx.lineWidth = 1
    // c.ctx.strokeRect(0,block.baseline,block.bounds.w, 1)
    // console.log(`baseline ${block.text} ${block.icon}`,block.baseline)
    // console.log('metrics',block.bounds,'margin',block.margin, 'border',block.border, 'padding',block.padding)

    if (block.children) {
        for (let ch of block.children) {
            drawBlock(c, ch)
        }
    }
    c.ctx.restore()
}

