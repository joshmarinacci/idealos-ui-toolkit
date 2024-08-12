import {Bounds, Insets, Point} from "josh_js_util"

export type RenderParameters = {
    ctx:CanvasRenderingContext2D
    fontSize: string
    debug:boolean
}

export type Border = {
    width:number,
    color:string
}


export type VBlock = {
    text?:string,
    bounds:Bounds,
    margin?: Insets,
    border?:Border,
    padding?: Insets,

    icon?: "square-empty"
    children?:VBlock[]

    baseline:number,
    background?:string
    color?:string
}

function addInsets(bounds: Bounds, padding: Insets):Bounds {
    return new Bounds(bounds.x, bounds.y, bounds.w + padding.left + padding.right, bounds.h + padding.top + padding.bottom)
}

export function Button(c:RenderParameters, text:string):VBlock {
    const m = c.ctx.measureText(text)
    let bounds = new Bounds(0,0,m.width,m.fontBoundingBoxAscent+m.fontBoundingBoxDescent)
    const padding = new Insets(5,5,5,5)
    bounds = addInsets(bounds,padding)
    return {text, bounds, children:[], baseline: m.fontBoundingBoxAscent,
    background:"aqua", color:"white", padding: padding, border: {
        width:1,
        color:'black'
    }}
}


export function Checkbox(c: RenderParameters, text: string, b: boolean) {
    return HBox(c, [
        CheckIcon(c),
        Label(c,'text')
    ])
}


export function CheckIcon(c:RenderParameters):VBlock {
    return {
        bounds: new Bounds(0,0,16,16),
        baseline: 8,
        icon:"square-empty",
    }
}
export function Label(c:RenderParameters, text:string):VBlock {
    const m = c.ctx.measureText(text)
    let bounds = new Bounds(0,0,m.width,m.fontBoundingBoxAscent+m.fontBoundingBoxDescent)
    const padding = new Insets(5,5,5,5)
    bounds = addInsets(bounds,padding)
    return {text: text, bounds: bounds, children:[], baseline: m.fontBoundingBoxAscent, padding:padding} as VBlock
}
export function VBox(_c: RenderParameters, vBlocks: VBlock[]):VBlock {
    let bounds = new Bounds(0,0,0,0)
    const border:Border = {
        width:1,
        color:'red',
    }
    bounds.w += border.width*2
    bounds.h += border.width*2
    for(let ch of vBlocks) {
        if(ch.bounds.w > bounds.w) {
            bounds.w = ch.bounds.w
        }
        ch.bounds.y += bounds.h
        bounds.h += ch.bounds.h
    }
    bounds = bounds.grow(1)
    return {
        text:undefined,
        bounds:bounds,
        children:vBlocks,
        baseline: 0,
        border:border,
    }
}
export function HBox(c:RenderParameters, children:VBlock[]):VBlock {
    let bounds = new Bounds(0,0,0,0)
    const border:Border = {
        width:1,
        color:'red',
    }
    bounds.w += border.width*2
    bounds.h += border.width*2
    let pt = new Point(bounds.x,bounds.y).add(new Point(2,2))
    for(let ch of children) {
        ch.bounds.x = pt.x
        ch.bounds.y = pt.y
        pt.x += ch.bounds.w
        bounds.w += ch.bounds.w
        bounds.h = Math.max(bounds.h, ch.bounds.h)
    }
    bounds = bounds.grow(1)
    return {
        text:undefined,
        bounds:bounds,
        children:children,
        baseline: 0,
        border:border,
    }

}

export function drawBlock(c: RenderParameters, block: VBlock) {
    c.ctx.save()
    if(c.debug) c.ctx.strokeRect(block.bounds.x,block.bounds.y,block.bounds.w,block.bounds.h)
    c.ctx.translate(block.bounds.x, block.bounds.y)
    if(block.background) {
        c.ctx.fillStyle = block.background
        c.ctx.fillRect(0,0,block.bounds.w,block.bounds.h)
    }
    if(block.border) {
        c.ctx.strokeStyle = block.border.color
        c.ctx.lineWidth = block.border.width
        c.ctx.strokeRect(0,0,block.bounds.w,block.bounds.h)
    }
    if(block.padding) {
        c.ctx.translate(block.padding.left, block.padding.top)
    }
    c.ctx.fillStyle = 'black'
    if(block.color) {
        c.ctx.fillStyle = block.color
    }
    if (block.text) {
        c.ctx.fillText(block.text, 0, block.baseline)
    }
    if(block.icon) {
        if(block.icon === 'square-empty') {
            c.ctx.strokeStyle = 'black'
            c.ctx.lineWidth = 1
            c.ctx.strokeRect(0,0,16,16)
        }
    }
    if(block.children) {
        for(let ch of block.children) {
            drawBlock(c,ch)
        }
    }
    c.ctx.restore()
}

