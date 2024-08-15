import {
    AxisLayout,
    AxisSelfLayout,
    ElementSettings,
    GElement,
    GRenderNode,
    LayoutConstraints,
    Style,
    ZERO_INSETS,
    ZERO_POINT
} from "./base.ts";
import {RenderContext, sizeWithPadding} from "./gfx.ts";
import {Bounds, Insets, Point, Size} from "josh_js_util";

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
        size = sizeWithPadding(size,this.settings.padding)
        return new GRenderNode({
            id: "text element",
            text: this.settings.text,
            font: Style.font,
            size: size,
            pos: new Point(0, 0),
            contentOffset: new Point(this.settings.padding.left,this.settings.padding.top),
            baseline: metrics.emHeightAscent + metrics.emHeightDescent,
            background: this.settings.backgroundColor,
            children: [],
            padding: this.settings.padding,
            margin: this.settings.margin,
            borderWidth: ZERO_INSETS,
            textColor:Style.textColor,
            borderColor:'gray'
        })
    }
}


class SquareElement implements GElement {
    private size: number;
    private fill: string;

    constructor(number: number, fill: string) {
        this.size = number
        this.fill = fill
    }

    layout(_rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        return new GRenderNode({
            id: 'square',
            text: "",
            background: this.fill,
            size: new Size(this.size, this.size),
            pos: new Point(0, 0),
            baseline: this.size/2,
            font: Style.font,
            children: [],
            margin: ZERO_INSETS,
            borderWidth: ZERO_INSETS,
            padding: ZERO_INSETS,
            contentOffset:ZERO_POINT,
            borderColor:'black',
            textColor:'black'
        })
    }

}

export function Square(number: number, red: string): GElement {
    return new SquareElement(number, red)
}

type MHBoxParameters = {
    mainAxisSelfLayout: AxisSelfLayout,
    crossAxisSelfLayout: AxisSelfLayout,
    mainAxisLayout: AxisLayout,
    crossAxisLayout: AxisLayout,
    children: GElement[],
    background: string,
    padding: Insets
    margin: Insets,
    borderWidth: Insets,
    borderColor: string
}

function bdsSubInsets(bds: Bounds, insets: Insets) {
    return new Bounds(
        bds.x + insets.left,
        bds.y + insets.top,
        bds.w - insets.left - insets.right,
        bds.h - insets.top - insets.bottom,
    )
}

function bdsAddInsets(bds: Bounds, insets: Insets) {
    return new Bounds(
        bds.x - insets.left,
        bds.y - insets.top,
        bds.w + insets.left + insets.right,
        bds.h + insets.top + insets.bottom,
    )
}

export class MHBoxElement implements GElement {
    private settings: MHBoxParameters;

    constructor(param: MHBoxParameters) {
        this.settings = param
    }

    layout(rc: RenderContext, cons:LayoutConstraints): GRenderNode {
        this.log(`space ${cons}`)
        let chs = this.settings.children
        let map = new Map<GElement,GRenderNode>()
        let expanders = chs.filter(ch => ch instanceof HExpander)
        let non_expanders = chs.filter(ch => !(ch instanceof HExpander))
        this.log(`exp ${expanders.length} non = ${non_expanders.length}`)

        let fullBounds = new Bounds(0,0,0,0)
        let contentBounds = new Bounds(0,0,0,0)

        if(this.settings.mainAxisSelfLayout === 'grow') {
            this.log("growing my width")
            contentBounds.w = cons.space.w
            fullBounds.w = cons.space.w
            contentBounds.h = cons.space.h
            fullBounds.h = cons.space.h

            // account for insets
            contentBounds = this.subtractInsets(contentBounds)
            this.log("started content bounds",contentBounds)

            // layout the non expander children
            let non_expander_total_width = 0
            non_expanders.map(ch => {
                let node = ch.layout(rc,{
                    space:contentBounds.size()
                })
                non_expander_total_width += node.settings.size.w
                map.set(ch,node)
            })
            this.log(`non ex-ch total width ${non_expander_total_width}`)
            let leftover = contentBounds.w - non_expander_total_width
            let leftover_per_child = leftover/expanders.length
            this.log(`leftover ${leftover}`)
            // layout the expander children
            expanders.map(ch => {
                let node = ch.layout(rc,{
                    space:new Size(leftover_per_child, contentBounds.h)
                })
                leftover -= leftover_per_child
                // non_expander_total_width += node.settings.size.w
                map.set(ch,node)
            })
            this.log(`final leftover is ${leftover}`)

            //find the max child height
            let max_child_height = 0
            chs.forEach(ch => {
                let node = map.get(ch) as GRenderNode
                max_child_height = Math.max(node.settings.size.h, max_child_height)
            })

            // position all children
            let x = contentBounds.x
            if(this.settings.mainAxisLayout === 'start') {
                x = contentBounds.x
            }
            if(this.settings.mainAxisLayout === 'center') {
                x = contentBounds.x + leftover/2
            }
            if(this.settings.mainAxisLayout === 'end') {
                x = contentBounds.x + leftover
            }
            let y = contentBounds.y
            this.log("layout children at",x,y)
            chs.forEach(ch => {
                let node = map.get(ch) as GRenderNode
                node.settings.pos.x = x
                if(this.settings.crossAxisLayout === 'start') {
                    node.settings.pos.y = y
                }
                if(this.settings.crossAxisLayout === 'center') {
                    node.settings.pos.y = y + contentBounds.h/2 - node.settings.size.h/2
                }
                if(this.settings.crossAxisLayout === 'end') {
                    node.settings.pos.y = y + contentBounds.h - node.settings.size.h
                }
                x += node.settings.size.w
            })
            let children = this.settings.children.map(ch => map.get(ch) as GRenderNode)
            return new GRenderNode({
                background: this.settings.background,
                baseline: 0,
                font: Style.font,
                pos: new Point(0, 0),
                size: fullBounds.size(),
                text: "",
                id: "mhbox",
                children: children,
                padding: this.settings.padding,
                contentOffset: contentBounds.position(),
                borderColor:'black',
                margin: this.settings.margin,
                textColor:'black',
                borderWidth: this.settings.borderWidth
            })
        }
        if(this.settings.mainAxisSelfLayout == 'shrink') {
            this.log('shrinking my width')
            contentBounds.w = cons.space.w
            fullBounds.w = cons.space.w
            contentBounds.h = cons.space.h
            fullBounds.h = cons.space.h
            contentBounds = this.subtractInsets(contentBounds)
            this.log("started content bounds",contentBounds)
            // layout all children.
            chs.forEach(ch => {
                let node = ch.layout(rc,{
                    space:contentBounds.size()
                })
                map.set(ch,node)
            })

            let max_child_height = 0
            let child_total_width = 0
            // get total child bounds
            chs.forEach(ch => {
                let node = map.get(ch) as GRenderNode
                child_total_width += node.settings.size.w
                max_child_height = Math.max(max_child_height, node.settings.size.h)
            })
            contentBounds.w = child_total_width
            contentBounds.h = max_child_height
            fullBounds = this.addInsets(contentBounds)
            this.log(`content bounds ${contentBounds}`)
            this.log(`full bounds ${fullBounds}`)

            // position all children
            let x = contentBounds.x
            chs.forEach(ch => {
                let node = map.get(ch) as GRenderNode
                node.settings.pos.x = x
                x += node.settings.size.w
                node.settings.pos.y = contentBounds.y
                if(this.settings.crossAxisLayout === 'start') {
                    node.settings.pos.y = contentBounds.y
                }
                if(this.settings.crossAxisLayout === 'center') {
                    node.settings.pos.y = contentBounds.y + (contentBounds.h - node.settings.size.h)/2
                }
                if(this.settings.crossAxisLayout === 'end') {
                    node.settings.pos.y = contentBounds.y + contentBounds.h - node.settings.size.h
                }
            })

            // fullBounds.w = contentBounds.w + this.settings.margin.left
            // fullBounds.w = child_total_width
            // fullBounds.h = max_child_height

            let children = chs.map(ch => map.get(ch) as GRenderNode)
            return new GRenderNode({
                background: this.settings.background,
                baseline: 0,
                font: Style.font,
                pos: new Point(0, 0),
                size: fullBounds.size(),
                text: "",
                id: "mhbox",
                children: children,
                padding: this.settings.padding,
                contentOffset: contentBounds.position(),
                borderColor:'black',
                margin: this.settings.margin,
                textColor:'black',
                borderWidth: this.settings.borderWidth
            })

        }

        // // layout non expander children
        // const non_expander_children = chs.map(ch => {
        //     let node = ch.layout(rc,{space:cons.space})
        //     map.set(ch,node)
        //     return node
        // })
        // let min_width = 0
        // let max_height = 0
        // for (let ch of non_expander_children) {
        //     min_width += ch.settings.size.w
        //     max_height = Math.max(max_height, ch.settings.size.h)
        // }
        // if (this.settings.mainAxisSelfLayout === 'grow') {
        //     contentBounds.w = cons.space.w
        // } else {
        //     contentBounds.w = min_width
        // }
        // if(this.settings.crossAxisSelfLayout === 'grow') {
        //     contentBounds.h = cons.space.h
        // } else {
        //     contentBounds.h = 100
        // }

        // this.log('content bounds', contentBounds)
        // let leftover = contentBounds.w - min_width
        // this.log("leftover is",leftover)
        // let expander_count = expanders.length
        // this.log("expander count",expander_count)
        // chs.map(ch => {
        //     let ndoe = ch.layout(rc,{space:cons.space})
        //     map.set(ch,ndoe)
        //     return ndoe
        // })
        // let h = (this.settings.crossAxisSelfLayout === 'grow') ? space.h : y
        // this.log("after insets",contentBounds)
        // let x = contentBounds.x
        // if (this.settings.mainAxisLayout === 'start') {
        //     x = contentBounds.x
        // }
        // if (this.settings.mainAxisLayout === 'center') {
        //     x = (contentBounds.w - min_width) / 2
        // }
        // if (this.settings.mainAxisLayout === 'end') {
        //     x = contentBounds.w - min_width
        // }
        // // this.log("hbox padding", contentBounds)
        //
        // // do final position of children
        // let y = contentBounds.y
        // let children = this.settings.children.map(ch => map.get(ch) as GRenderNode)
        // for (let ch of children) {
        //     // console.log('ch',ch.settings.id,'size',ch.settings.size)
        //     ch.settings.pos.x = x
        //     ch.settings.pos.y = contentBounds.y
        //     x += ch.settings.size.w
        //     y = Math.max(ch.settings.size.h, y)
        // }
        // // let w = (this.settings.mainAxisSelfLayout === 'grow')?space.w:x
        // // let h = (this.settings.crossAxisSelfLayout === 'grow') ? space.h : y
        // // let size = new Size(contentBounds.w, h)
        // // size = sizeWithPadding(size,this.settings.padding)
        // let size = contentBounds.size()
        // size = sizeWithPadding(size,this.settings.margin)
        // size = sizeWithPadding(size,this.settings.borderWidth)
        // size = sizeWithPadding(size,this.settings.padding)
        // this.log("final size",size)
        // return new GRenderNode({
        //     background: this.settings.background,
        //     baseline: 0,
        //     font: Style.font,
        //     pos: new Point(0, 0),
        //     size: size,
        //     text: "",
        //     id: "mhbox",
        //     children: children,
        //     padding: this.settings.padding,
        //     contentOffset: contentBounds.position(),
        //     borderColor:'black',
        //     margin: this.settings.margin,
        //     textColor:'black',
        //     borderWidth: this.settings.borderWidth
        // })
    }

    private log(...output:any[]   ) {
        console.log("HBox", ...output)
    }

    private subtractInsets(contentBounds: Bounds) {
        // subtract padding
        contentBounds = bdsSubInsets(contentBounds,this.settings.margin)
        contentBounds = bdsSubInsets(contentBounds,this.settings.borderWidth)
        contentBounds = bdsSubInsets(contentBounds,this.settings.padding)
        return contentBounds
    }

    private addInsets(contentBounds: Bounds) {
        contentBounds = bdsAddInsets(contentBounds,this.settings.margin)
        contentBounds = bdsAddInsets(contentBounds,this.settings.borderWidth)
        contentBounds = bdsAddInsets(contentBounds,this.settings.padding)
        return contentBounds
    }
}

export class HExpander implements GElement {
    layout(_rc: RenderContext, cons:LayoutConstraints): GRenderNode {
        return new GRenderNode({
            baseline: 0,
            borderColor: "",
            borderWidth: ZERO_INSETS,
            children: [],
            font: "",
            id: "",
            margin: ZERO_INSETS,
            padding: ZERO_INSETS,
            pos: ZERO_POINT,
            size: new Size(cons.space.w,10),
            text: "",
            textColor: "",
            background: 'cyan',
            contentOffset: new Point(0, 0)
        })
    }
}
