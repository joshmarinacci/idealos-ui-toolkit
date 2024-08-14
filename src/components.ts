import {Bounds, Insets, Point, Size} from "josh_js_util"
import {Icons} from "./icons.ts";

export type RenderParameters = {
    ctx: CanvasRenderingContext2D
    fontSize: string
    debug: {
        outline: boolean,
        baseline: boolean
    }
    redraw: () => void
}


const hue = 32
const StyleVars = {
    color: 'black',
    borderColor: 'black',
    fontSize: '16px',
    fontFamily: 'sans-serif',
    margin: new Insets(4, 4, 4, 4),
    padding: new Insets(7, 8, 7, 8),
    background: `hsl(${hue},5%,100%)`,
    // selectedBackground: `hsl(${hue},90%,57%)`,
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

export type CEvent = {
    type: "click" | "move"
}
export type EventHandler = (event: CEvent) => void

export type VBlock = {
    name?: string,
    text?: string,
    bounds: Bounds,
    margin?: Insets,
    border?: Border,
    padding?: Insets,
    flex?: number

    icon?: Icons
    children?: VBlock[]

    baseline: number,
    background?: string
    color?: string
    shadow?: boolean
    handleEvent?: EventHandler;
    clip?: boolean
}

const NullInsets: Insets = new Insets(0, 0, 0, 0)

export const DebugBorder: Border = {
    width: 3,
    color: 'red'
}

type LabelOpts = {
    text: string
    shadow?: boolean
    padding?: Insets,
    margin?: Insets,
    handleEvent?: EventHandler
}

export function Label(c: RenderParameters, opts: LabelOpts): VBlock {
    const m = c.ctx.measureText(opts.text)
    let bounds = new Bounds(0, 0, m.width, m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)
    // console.log("text height is",m.fontBoundingBoxAscent+m.fontBoundingBoxDescent)
    // console.log('metrics',text,m)
    bounds = addInsets(bounds, opts.padding || StyleVars.padding)
    bounds = addInsets(bounds, opts.margin || StyleVars.margin)
    return {
        name: 'Label',
        text: opts.text,
        bounds: bounds,
        children: [],
        baseline: Math.floor(m.fontBoundingBoxAscent),
        padding: opts.padding || StyleVars.padding,
        margin: opts.margin || StyleVars.margin,
        shadow: opts.shadow,
        handleEvent: opts.handleEvent,
    }
}

function addInsets(bounds: Bounds, padding: Insets): Bounds {
    return new Bounds(bounds.x, bounds.y, bounds.w + padding.left + padding.right, bounds.h + padding.top + padding.bottom)
}

export function Icon(_c: RenderParameters, opts: IconParameters): VBlock {
    let bounds = new Bounds(0, 0, 24, 17)
    let padding = opts.padding || StyleVars.padding
    let margin = opts.margin || StyleVars.margin
    bounds = addInsets(bounds, padding)
    bounds = addInsets(bounds, margin)
    return {
        name: 'Icon',
        bounds: bounds,
        baseline: 20,
        icon: opts.icon,
        padding: padding,
        margin: margin,
        color: opts.color,
        shadow: opts.shadow
        // border: DebugBorder
    }
}

type ShrinkBoxParamters = {
    margin?: Insets,
    border?: Border,
    padding?: Insets,
    background?: string
    handleEvent?: EventHandler
    flex?: number
}

export function ShrinkBox(_c: RenderParameters, children: VBlock[], opts?: ShrinkBoxParamters): VBlock {
    let margin = new Insets(0, 0, 0, 0)
    let padding = new Insets(0, 0, 0, 0)
    let border = undefined
    if (opts) {
        if (opts.margin) margin = opts.margin
        if (opts.padding) padding = opts.padding
        if (opts.border) border = opts.border
    }

    let inner = new Bounds(0, 0, 0, 0)
    for (let ch of children) {
        if (ch.bounds.h > inner.h) inner.h = ch.bounds.h
        ch.bounds.x = inner.w
        inner.w += ch.bounds.w
    }
    let bounds = new Bounds(0, 0, 0, 0)
    bounds = addInsets(bounds, margin)
    bounds = addInsets(bounds, padding)
    bounds.h += inner.h
    bounds.w += inner.w
    for (let ch of children) {
        ch.bounds.x += margin.left + padding.left
        ch.bounds.y += margin.top + padding.bottom
    }

    return {
        name: 'ShrinkBox',
        baseline: 0,
        bounds: bounds,
        padding: padding,
        margin: margin,
        children: children,
        border: border,
        background: opts?.background,
        handleEvent: opts?.handleEvent,
        flex: opts?.flex
    }
}

type ButtonOpts = {
    text: string,
    selected?: boolean,
    flex?: number
}

export function Button(c: RenderParameters, opts: ButtonOpts): VBlock {
    return ShrinkBox(c, [
        Label(c, {
            text: opts.text,
            shadow: true,
            padding: NullInsets,
            margin: NullInsets,
        })], {
        margin: StyleVars.margin,
        border: {
            width: StyleVars.borderWidth,
            color: StyleVars.borderColor,
        },
        padding: StyleVars.padding,
        flex: opts.flex,
        handleEvent: (_event) => {
            console.log("button got an event")
        }
    })
}

type CheckboxOpts = {
    handleEvent?: EventHandler
    selected: boolean,
    text: string
}

export function Checkbox(c: RenderParameters, opts: CheckboxOpts) {
    return IconButton(c, {
        icon: opts.selected ? Icons.CheckboxChecked : Icons.CheckboxUnchecked,
        text: opts.text,
        hideBorder: true,
        handleEvent: opts.handleEvent,
    })
}

export function RadioButton(c: RenderParameters, text: string, b: boolean) {
    return IconButton(c, {
        text: text,
        icon: b ? Icons.RadioButtonChecked : Icons.RadioButtonUnchecked,
        hideBorder: true,
    })
}


export type ToggleButtonOptions = {
    text: string
    selected: boolean
    handleEvent?: EventHandler
}

export function ToggleButton(c: RenderParameters, opts: ToggleButtonOptions): VBlock {
    return IconButton(c, {
        text: opts.text,
        icon: opts.selected ? Icons.ToggleOn : Icons.ToggleOff,
        hideBorder: true,
        handleEvent: opts.handleEvent,
    })
}


type IconParameters = {
    icon: Icons
    color?: string
    shadow?: boolean
    padding?: Insets
    margin?: Insets
}
type TextInputParameters = {
    placeholder: string
}

export function FixedBox(_c: RenderParameters,
                         child: VBlock,
                         opts: { size: Size, border: Border }): VBlock {
    return {
        baseline: 0,
        bounds: new Bounds(0, 0, opts.size.w, opts.size.h),
        children: [child],
        border: opts.border,
    }
}

export function TextInput(c: RenderParameters, opts: TextInputParameters): VBlock {
    return FixedBox(c,
        Label(c, {text: opts.placeholder})
        , {
            size: new Size(100, 32),
            border: {
                width: StyleVars.borderWidth,
                color: StyleVars.borderColor,
            }
        })
}

export function Tag(c: RenderParameters, opts: { text: string }) {
    return ShrinkBox(c, [Label(c, {text: opts.text})], {
        background: "aqua"
    })
}

export function NumberInput(c: RenderParameters, opts: TextInputParameters) {
    return TextInput(c, opts)
}

export function SearchInput(c: RenderParameters, opts: TextInputParameters) {
    return TextInput(c, opts)
}

type IconButtonOptions = {
    icon: Icons,
    text?: string,
    hideBorder?: boolean
    handleEvent?: EventHandler
}

export function IconButton(c: RenderParameters, opts: IconButtonOptions): VBlock {
    const children = [Icon(c, {
        icon: opts.icon,
        shadow: true,
        padding: NullInsets,
        margin: NullInsets
    })]
    if (opts.text) children.push(Label(c, {
        text: opts.text,
        shadow: true,
        padding: NullInsets,
        margin: NullInsets
    }))
    let border: Border | undefined = {
        width: StyleVars.borderWidth,
        color: StyleVars.borderColor,
    }
    if (opts.hideBorder) {
        border = undefined
    }
    return ShrinkBox(c, children, {
        margin: StyleVars.margin,
        border: border,
        padding: StyleVars.padding,
        handleEvent: opts.handleEvent,
    })
}


export function Separator(_c: RenderParameters): VBlock {
    const size = new Size(5, 32)
    const margin = new Insets(5, 10, 5, 10)
    const bounds = new Bounds(
        0,
        0,
        margin.left + size.w + margin.right,
        margin.top + size.h + margin.bottom,
    )
    return {
        name: 'Separator',
        bounds: bounds,
        margin: margin,
        background: StyleVars.controlBorderColor,
        baseline: 0,
        // border:DebugBorder
    }
}

type AxisAlign = 'start' | 'middle' | 'end'
type SelfLayout = 'grow' | 'shrink'
type BoxParameters = {
    preferredSize?: Size,
    border?: Border
    padding?: Insets
    margin?: Insets
    background?: string
    selfLayout?: SelfLayout,
    mainAxisAlign?: AxisAlign
    crossAxisAlign?: AxisAlign
    flex?:number
}

type BoxProperties = {
    content: Bounds
    selfLayout: SelfLayout
    mainAxisAlign: AxisAlign
    crossAxisAlign: AxisAlign
}

function calculateBoxProperties(opts:BoxParameters):BoxProperties {
    let content = new Bounds(0, 0, 0, 0)
    if (opts?.preferredSize) content = Bounds.fromPointSize(new Point(0, 0), opts.preferredSize)
    let selfLayout: SelfLayout = 'shrink'
    if (opts.selfLayout) selfLayout = opts.selfLayout
    let main_align: AxisAlign = "start"
    if (opts && opts.mainAxisAlign) main_align = opts.mainAxisAlign
    let cross_align: AxisAlign = "start"
    if (opts && opts.crossAxisAlign) cross_align = opts.crossAxisAlign

    if(selfLayout === 'grow' && !opts.preferredSize) {
        console.warn("Box grow set without a preferred size")
    }
    return {
        content: content,
        selfLayout: selfLayout,
        mainAxisAlign:main_align,
        crossAxisAlign:cross_align,
    }
}

export function VBox(_c: RenderParameters, children: VBlock[], opts: BoxParameters): VBlock {
    const p = calculateBoxProperties(opts)

    let kid_main_length = 0
    let flex_count = 0
    let kid_cross_length = 0
    for (let ch of children) {
        kid_main_length += ch.bounds.h
        kid_cross_length = Math.max(ch.bounds.w, kid_cross_length)
        if (ch.flex && ch.flex > 0) flex_count += 1
    }

    if (p.selfLayout === 'shrink') {
        let pt = new Point(0, 0);
        for (let ch of children) {
            ch.bounds.x = pt.x
            ch.bounds.y = pt.y
            pt.y += ch.bounds.h
        }
        p.content.h = pt.y
        p.content.w = kid_cross_length
    }
    if (p.selfLayout === 'grow') {
        let leftover = p.content.h - kid_main_length
        // if any flex kids, distribute the leftover width
        if (flex_count > 0) {
            for (let ch of children) {
                if (ch.flex && ch.flex > 0) {
                    ch.bounds.h += leftover / flex_count
                }
            }
        }

        // calc new kids_width
        kid_main_length = 0
        for (let ch of children) {
            kid_main_length += ch.bounds.h
        }

        // then do normal layout
        if (p.mainAxisAlign === 'start') {
            let pt = new Point(0, 0);
            for (let ch of children) {
                ch.bounds.x = pt.x
                ch.bounds.y = pt.y
                pt.y += ch.bounds.h
            }
        }
        if (p.mainAxisAlign === 'end') {
            let pt = new Point(0,p.content.h - kid_main_length);
            for (let ch of children) {
                ch.bounds.x = pt.x
                ch.bounds.y = pt.y
                pt.y += ch.bounds.h
            }
        }
        if (p.mainAxisAlign === 'middle') {
            let pt = new Point(0,(p.content.h - kid_main_length) / 2);
            for (let ch of children) {
                ch.bounds.x = pt.x
                ch.bounds.y = pt.y
                pt.y += ch.bounds.h
            }
        }

        if (p.crossAxisAlign === 'start') {
            for (let ch of children) {
                ch.bounds.x = 0
            }
        }
        if (p.crossAxisAlign === 'middle') {
            for (let ch of children) {
                ch.bounds.x = p.content.w / 2 - ch.bounds.w / 2
            }
        }
        if (p.crossAxisAlign === 'end') {
            for (let ch of children) {
                ch.bounds.x = p.content.w - ch.bounds.w
            }
        }
    }


    return {
        name: 'VBox',
        bounds: p.content,
        children: children,
        baseline: 20,
        border: opts?.border,
        padding: opts?.padding,
        margin: opts?.margin,
    }
}


export function HBox(_c: RenderParameters, children: VBlock[], opts: BoxParameters): VBlock {
    const p = calculateBoxProperties(opts)

    // count flex kids, and total kid width
    let kids_width = 0
    let flex_count = 0
    let kids_height = 0
    for (let ch of children) {
        kids_width += ch.bounds.w
        kids_height = Math.max(ch.bounds.h, kids_height)
        if (ch.flex && ch.flex > 0) flex_count += 1
    }

    if (p.selfLayout === 'shrink') {
        let pt = new Point(0, 0);
        for (let ch of children) {
            ch.bounds.x = pt.x
            ch.bounds.y = pt.y
            pt.x += ch.bounds.w
        }
        p.content.w = pt.x
        p.content.h = kids_height
    }
    if (p.selfLayout === 'grow') {
        let leftover = p.content.w - kids_width
        // if any flex kids, distribute the leftover width
        if (flex_count > 0) {
            for (let ch of children) {
                if (ch.flex && ch.flex > 0) {
                    ch.bounds.w += leftover / flex_count
                }
            }
        }

        // calc new kids_width
        kids_width = 0
        for (let ch of children) {
            kids_width += ch.bounds.w
        }

        // then do normal layout
        if (p.mainAxisAlign === 'start') {
            let pt = new Point(0, 0);
            for (let ch of children) {
                ch.bounds.x = pt.x
                ch.bounds.y = pt.y
                pt.x += ch.bounds.w
            }
        }
        if (p.mainAxisAlign === 'end') {
            let pt = new Point(p.content.w - kids_width, 0);
            for (let ch of children) {
                ch.bounds.x = pt.x
                ch.bounds.y = pt.y
                pt.x += ch.bounds.w
            }
        }
        if (p.mainAxisAlign === 'middle') {
            let pt = new Point((p.content.w - kids_width) / 2, 0);
            for (let ch of children) {
                ch.bounds.x = pt.x
                ch.bounds.y = pt.y
                pt.x += ch.bounds.w
            }
        }

        if (p.crossAxisAlign === 'start') {
            for (let ch of children) {
                ch.bounds.y = 0
            }
        }
        if (p.crossAxisAlign === 'middle') {
            for (let ch of children) {
                ch.bounds.y = p.content.h / 2 - ch.bounds.h / 2
            }
        }
        if (p.crossAxisAlign === 'end') {
            for (let ch of children) {
                ch.bounds.y = p.content.h - ch.bounds.h
            }
        }
    }

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
    return {
        name: 'HBox',
        bounds: p.content,
        children: children,
        baseline: 20,
        border: opts?.border,
        padding: opts?.padding,
        margin: opts?.margin,
        flex: opts?.flex,
    }

}

export type DrawBlockOpts = {
    highlight?: VBlock
}

export function drawBlock(c: RenderParameters, block: VBlock, opts: DrawBlockOpts) {
    c.ctx.save()
    if (c.debug.outline) {
        c.ctx.lineWidth = 0.5
        c.ctx.strokeStyle = 'purple'
        c.ctx.strokeRect(block.bounds.x, block.bounds.y, block.bounds.w, block.bounds.h)
    }
    c.ctx.translate(block.bounds.x, block.bounds.y)
    let offset = new Point(0, 0)
    if (block.margin) {
        offset.x += block.margin.left
        offset.y += block.margin.top
    }
    if (block.background) {
        c.ctx.fillStyle = block.background
        c.ctx.fillRect(offset.x, offset.y, block.bounds.w - offset.x * 2, block.bounds.h - offset.y * 2)
    }
    if (block.border) {
        c.ctx.strokeStyle = block.border.color
        c.ctx.lineWidth = block.border.width
        c.ctx.strokeRect(offset.x, offset.y, block.bounds.w - offset.x * 2, block.bounds.h - offset.y * 2)
    }
    if (block.padding) {
        offset.x += block.padding.left
        offset.y += block.padding.top
    }
    c.ctx.fillStyle = 'black'
    if (block.color) {
        c.ctx.fillStyle = block.color
    }
    if (block.text) {
        c.ctx.fillText(block.text, offset.x, offset.y + block.baseline)
    }
    if (block.icon) {
        c.ctx.font = '24px material-icons'
        c.ctx.fillStyle = (block.color ? block.color : 'black')
        c.ctx.fillText(block.icon, offset.x, offset.y + block.baseline)
    }
    // draw the baseline
    if (c.debug.baseline) {
        c.ctx.strokeStyle = 'purple'
        c.ctx.lineWidth = 1
        c.ctx.strokeRect(0, block.baseline, block.bounds.w, 1)
        // console.log(`baseline ${block.text} ${block.icon}`,block.baseline)
        // console.log('metrics',block.bounds,'margin',block.margin, 'border',block.border, 'padding',block.padding)
    }

    if (block.children) {
        if (block.clip) {
            c.ctx.save()
            c.ctx.beginPath()
            c.ctx.rect(0, 0, block.bounds.w, block.bounds.h)
            c.ctx.closePath()
            c.ctx.clip()
            c.ctx.strokeStyle = 'yellow'
            c.ctx.stroke()
        }
        for (let ch of block.children) {
            drawBlock(c, ch, opts)
        }
        if (block.clip) {
            c.ctx.restore()
        }
    }
    c.ctx.restore()
    if (opts) {
        if (opts.highlight === block) {
            c.ctx.fillStyle = 'rgba(255,0,0,0.1)'
            c.ctx.fillRect(block.bounds.x, block.bounds.y, block.bounds.w, block.bounds.h)
        }
    }
}

function ListItem(c: RenderParameters, opts: {
    item: string,
    handleEvent: EventHandler,
    background: string
}): VBlock {
    return ShrinkBox(c, [
        Label(c, {text: opts.item}),
    ], {handleEvent: opts.handleEvent, background: opts.background})
}

export type ListViewSelectionCallback = (item: string) => void

export function ListView(c: RenderParameters, opts: {
    data: string[],
    selected: string,
    onSelected: ListViewSelectionCallback
}): VBlock {
    let bounds = new Bounds(0, 0, 200, 110)
    let children = opts.data.map(item => {
        return ListItem(c, {
            item: item,
            handleEvent: (_event) => opts.onSelected(item),
            background: item === opts.selected ? StyleVars.selectedControlBackground : StyleVars.controlBackgroundColor
        })
    })
    let pt = new Point(0, 0)
    let gap = 5
    for (let ch of children) {
        ch.bounds.x = pt.x
        ch.bounds.y = pt.y
        ch.bounds.w = bounds.w - 3
        pt.y += ch.bounds.h
        pt.y += gap
    }
    return {
        name: "ListView",
        bounds: bounds,
        border: DebugBorder,
        children: children,
        baseline: 0,
        clip: true,
    }
}
