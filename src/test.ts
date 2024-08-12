import {Bounds, Insets, Point} from "josh_js_util"
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
    padding: 8,
    background: `hsl(${hue},5%,100%)`,
    selectedBackground: `hsl(${hue},90%,57%)`,
    borderRadius: '4px',
    borderWidth: '1px',
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

    icon?: "square-empty"
    children?: VBlock[]

    baseline: number,
    background?: string
    color?: string
}

function addInsets(bounds: Bounds, padding: Insets): Bounds {
    return new Bounds(bounds.x, bounds.y, bounds.w + padding.left + padding.right, bounds.h + padding.top + padding.bottom)
}

export function Button(c: RenderParameters, text: string, bg?: string): VBlock {
    const m = c.ctx.measureText(text)
    let bounds = new Bounds(0, 0, m.width, m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)
    const padding = new Insets(5, 5, 5, 5)
    bounds = addInsets(bounds, padding)
    bounds = addInsets(bounds, StyleVars.margin)
    return {
        text,
        bounds, children: [],
        baseline: m.fontBoundingBoxAscent,
        background: bg?bg:StyleVars.selectedBackground,
        color: "black",
        padding: padding,
        border: {
            width: 1,
            color: 'black',
        },
        margin: StyleVars.margin
    }
}


export function Checkbox(c: RenderParameters, text: string, b: boolean) {
    return HBox(c, [
        CheckIcon(c),
        Label(c, text)
    ])
}


export function CheckIcon(c: RenderParameters): VBlock {
    return {
        bounds: new Bounds(0, 0, 16, 16),
        baseline: 8,
        icon: "square-empty",
    }
}

export function Label(c: RenderParameters, text: string): VBlock {
    const m = c.ctx.measureText(text)
    let bounds = new Bounds(0, 0, m.width, m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)
    const padding = new Insets(5, 5, 5, 5)
    bounds = addInsets(bounds, padding)
    bounds = addInsets(bounds, StyleVars.margin)
    return {
        text: text,
        bounds: bounds,
        children: [],
        baseline: m.fontBoundingBoxAscent,
        padding: padding,
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


type TextInputParameters = {
    placeholder: string
}

export function TextInput(c: RenderParameters, opts: TextInputParameters): VBlock {
    return HBox(c, [
        Label(c, opts.placeholder)
    ])
}

export function NumberInput(c: RenderParameters, opts: TextInputParameters) {
    return TextInput(c, opts)
}

export function SearchInput(c: RenderParameters, opts: TextInputParameters) {
    return TextInput(c, opts)
}

export function IconButton(c: RenderParameters, opts: { icon: string; text?: string }): VBlock {
    const ch = [CheckIcon(c)]
    if (opts.text) ch.push(Label(c, opts.text))
    return HBox(c, ch)
}

export function Icon(c: RenderParameters, opts: { icon: Icons }): VBlock {
    return CheckIcon(c)
}

export function Separator(c: RenderParameters): VBlock {
    return {
        bounds: new Bounds(0, 0, 10, 30),
        background: "red",
        baseline: 0
    }
}

export function VBox(_c: RenderParameters, vBlocks: VBlock[]): VBlock {
    let bounds = new Bounds(0, 0, 0, 0)
    const border: Border = {
        width: 1,
        color: 'red',
    }
    bounds.w += border.width * 2
    bounds.h += border.width * 2
    for (let ch of vBlocks) {
        if (ch.bounds.w > bounds.w) {
            bounds.w = ch.bounds.w
        }
        ch.bounds.y += bounds.h
        bounds.h += ch.bounds.h
    }
    bounds = bounds.grow(1)
    return {
        text: undefined,
        bounds: bounds,
        children: vBlocks,
        baseline: 0,
        border: border,
    }
}

export function HBox(c: RenderParameters, children: VBlock[]): VBlock {
    let bounds = new Bounds(0, 0, 0, 0)
    const border: Border = {
        width: 1,
        color: 'red',
    }
    bounds.w += border.width * 2
    bounds.h += border.width * 2
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
        text: undefined,
        bounds: bounds,
        children: children,
        baseline: 0,
        border: border,
    }

}

export function drawBlock(c: RenderParameters, block: VBlock) {
    c.ctx.save()
    if (c.debug) {
        c.ctx.lineWidth = 0.5
        c.ctx.strokeStyle = 'purple'
        c.ctx.strokeRect(block.bounds.x, block.bounds.y, block.bounds.w, block.bounds.h)
    }
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
        if (block.icon === 'square-empty') {
            c.ctx.strokeStyle = 'black'
            c.ctx.lineWidth = 1
            c.ctx.strokeRect(0, 0, 16, 16)
        }
    }
    if (block.children) {
        for (let ch of block.children) {
            drawBlock(c, ch)
        }
    }
    c.ctx.restore()
}

