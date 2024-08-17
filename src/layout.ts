import {
    AxisLayout,
    AxisSelfLayout,
    EventHandler,
    GElement,
    GRenderNode,
    LayoutConstraints,
    ZERO_INSETS,
    ZERO_POINT
} from "./base.ts";
import {RenderContext } from "./gfx.ts";
import {Bounds, Insets, Point, Size} from "josh_js_util";
import {Style} from "./style.ts";

type BoxParameters = {
    id?:string,
    mainAxisSelfLayout?: AxisSelfLayout,
    crossAxisSelfLayout?: AxisSelfLayout,
    mainAxisLayout?: AxisLayout,
    crossAxisLayout?: AxisLayout,
    children: GElement[],
    background?: string,
    padding?: Insets
    margin?: Insets,
    borderWidth?: Insets,
    borderColor?: string,
    borderRadius?: number,
    handleEvent?:EventHandler,

    fixedWidth?:number
    fixedHeight?:number
}

type BoxRequirements = {
    id:string,
    mainAxisSelfLayout: AxisSelfLayout,
    crossAxisSelfLayout: AxisSelfLayout,
    mainAxisLayout: AxisLayout,
    crossAxisLayout: AxisLayout,
    children: GElement[],
    background: string,
    padding: Insets
    margin: Insets,
    borderWidth: Insets,
    borderColor: string,
    borderRadius: number,
    handleEvent?:EventHandler,

    fixedWidth?:number
    fixedHeight?:number
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

function withFallback<T>(value: T | undefined, fallback: T): T {
    return value || fallback
}

class BoxElementBase {
    protected settings: BoxRequirements;
    private log_enabled: boolean;

    constructor(settings: BoxRequirements) {
        this.settings = settings
        this.log_enabled = false
    }

    // @ts-ignore
    protected log(...output: any[]) {
        if(this.log_enabled) console.log("HBox", ...output)
    }

    protected subtractInsets(contentBounds: Bounds) {
        // subtract padding
        contentBounds = bdsSubInsets(contentBounds, this.settings.margin)
        contentBounds = bdsSubInsets(contentBounds, this.settings.borderWidth)
        contentBounds = bdsSubInsets(contentBounds, this.settings.padding)
        return contentBounds
    }
    protected getTotalInsets() {
        return addInsets(addInsets(this.settings.margin, this.settings.borderWidth),this.settings.padding)
    }
}
export class MHBoxElement extends BoxElementBase implements GElement {

    constructor(param: BoxParameters) {
        super( {
            id: param.id || "hbox",
            borderRadius: param.borderRadius || 0,
            mainAxisSelfLayout: withFallback(param.mainAxisSelfLayout,'shrink'),
            crossAxisSelfLayout: withFallback(param.crossAxisSelfLayout,'shrink'),
            crossAxisLayout: withFallback(param.crossAxisLayout, 'start'),
            mainAxisLayout: withFallback(param.mainAxisLayout,'center'),
            children: param.children,

            background: withFallback(param.background,Style.panelBackgroundColor),
            margin: withFallback(param.margin,Style.panelMargin),
            padding: withFallback(param.padding,Style.panelPadding),
            borderWidth: withFallback(param.borderWidth,Style.panelBorderWidth),
            borderColor: withFallback(param.borderColor,Style.panelBorderColor),
            handleEvent: param.handleEvent,

            fixedWidth: param.fixedWidth,
            fixedHeight: param.fixedHeight,
        })
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        this.log(`space ${cons}`)
        let chs = this.settings.children
        let map = new Map<GElement, GRenderNode>()
        let expanders = chs.filter(ch => ch instanceof HExpander)
        let non_expanders = chs.filter(ch => !(ch instanceof HExpander))
        this.log(`exp ${expanders.length} non = ${non_expanders.length}`)

        let fullBounds = new Bounds(0, 0, 0, 0)
        let contentBounds = new Bounds(0, 0, 0, 0)

        if (this.settings.mainAxisSelfLayout === 'grow') {
            this.log("growing my width")
            contentBounds.w = cons.space.w
            fullBounds.w = cons.space.w

            if(this.settings.fixedWidth) {
                contentBounds.w = this.settings.fixedWidth
                fullBounds.w = this.settings.fixedWidth
            }

            if (this.settings.crossAxisSelfLayout === 'grow') {
                contentBounds.h = cons.space.h
                fullBounds.h = cons.space.h
            }

            // account for insets
            contentBounds = this.subtractInsets(contentBounds)
            this.log("started content bounds", contentBounds)

            // layout the non expander children
            let non_expander_total_width = 0
            non_expanders.map(ch => {
                let node = ch.layout(rc, {
                    space: contentBounds.size(),
                    layout: this.settings.mainAxisSelfLayout,
                })
                non_expander_total_width += node.settings.size.w
                map.set(ch, node)
            })
            this.log(`non ex-ch total width ${non_expander_total_width}`)
            let leftover = contentBounds.w - non_expander_total_width
            let leftover_per_child = leftover / expanders.length
            this.log(`leftover ${leftover}`)
            // layout the expander children
            expanders.map(ch => {
                let node = ch.layout(rc, {
                    space: new Size(leftover_per_child, contentBounds.h),
                    layout: this.settings.mainAxisSelfLayout,
                })
                leftover -= leftover_per_child
                // non_expander_total_width += node.settings.size.w
                map.set(ch, node)
            })
            this.log(`final leftover is ${leftover}`)

            //find the max child height
            let max_child_height = 0
            chs.forEach(ch => {
                let node = map.get(ch) as GRenderNode
                max_child_height = Math.max(node.settings.size.h, max_child_height)
            })

            if (this.settings.crossAxisSelfLayout === 'shrink') {
                contentBounds.h = max_child_height
            }

            // position all children
            let x = contentBounds.x
            if (this.settings.mainAxisLayout === 'start') {
                x = contentBounds.x
            }
            if (this.settings.mainAxisLayout === 'center') {
                x = contentBounds.x + leftover / 2
            }
            if (this.settings.mainAxisLayout === 'end') {
                x = contentBounds.x + leftover
            }
            let y = contentBounds.y
            this.log("layout children at", x, y, contentBounds)
            this.layout_nodes_cross_axis(chs, map, contentBounds)
            chs.forEach(ch => {
                let node = map.get(ch) as GRenderNode
                node.settings.pos.x = x
                x += node.settings.size.w
            })
            let children = this.settings.children.map(ch => map.get(ch) as GRenderNode)
            fullBounds = this.addInsets(contentBounds)
            this.log(`content bounds ${contentBounds}`)
            this.log(`full bounds ${fullBounds}`)
            return new GRenderNode({
                background: this.settings.background,
                baseline: 0,
                font: Style.font,
                pos: new Point(0, 0),
                size: fullBounds.size(),
                text: "",
                id: this.settings.id,
                children: children,
                padding: this.settings.padding,
                contentOffset: contentBounds.position(),
                borderColor: this.settings.borderColor,
                margin: this.settings.margin,
                textColor: 'black',
                borderWidth: this.settings.borderWidth,
                borderRadius: this.settings.borderRadius,
                handleEvent: this.settings.handleEvent,
            })
        }
        if (this.settings.mainAxisSelfLayout == 'shrink') {
            this.log('shrinking my width')
            contentBounds.w = cons.space.w
            fullBounds.w = cons.space.w
            contentBounds.h = cons.space.h
            fullBounds.h = cons.space.h
            contentBounds = this.subtractInsets(contentBounds)
            this.log("started content bounds", contentBounds)
            // layout all children.
            chs.forEach(ch => {
                const node = ch.layout(rc, {
                    space: contentBounds.size(),
                    layout: this.settings.mainAxisSelfLayout,
                })
                map.set(ch, node)
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
            this.layout_nodes_cross_axis(chs, map, contentBounds)
            let x = contentBounds.x
            chs.forEach(ch => {
                let node = map.get(ch) as GRenderNode
                node.settings.pos.x = x
                x += node.settings.size.w
            })

            let children = chs.map(ch => map.get(ch) as GRenderNode)
            return new GRenderNode({
                background: this.settings.background,
                baseline: 0,
                font: Style.font,
                pos: new Point(0, 0),
                size: fullBounds.size(),
                text: "",
                id: this.settings.id,
                children: children,
                padding: this.settings.padding,
                contentOffset: contentBounds.position(),
                borderColor: this.settings.borderColor,
                margin: this.settings.margin,
                textColor: 'black',
                borderWidth: this.settings.borderWidth,
                borderRadius: this.settings.borderRadius,
                handleEvent: this.settings.handleEvent
            })

        }
        throw new Error(`unknown self layout type ${this.settings.mainAxisSelfLayout}`)
    }


    private addInsets(contentBounds: Bounds) {
        contentBounds = bdsAddInsets(contentBounds, this.settings.margin)
        contentBounds = bdsAddInsets(contentBounds, this.settings.borderWidth)
        contentBounds = bdsAddInsets(contentBounds, this.settings.padding)
        return contentBounds
    }

    private layout_nodes_cross_axis(chs: GElement[], map: Map<GElement, GRenderNode>, contentBounds: Bounds) {
        chs.forEach(ch => {
            let node = map.get(ch) as GRenderNode
            if (this.settings.crossAxisLayout === 'start') {
                node.settings.pos.y = contentBounds.y
            }
            if (this.settings.crossAxisLayout === 'center') {
                node.settings.pos.y = contentBounds.y + (contentBounds.h - node.settings.size.h) / 2
            }
            if (this.settings.crossAxisLayout === 'end') {
                node.settings.pos.y = contentBounds.y + contentBounds.h - node.settings.size.h
            }
        })
    }
}

export class HExpander implements GElement {
    layout(_rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        let size = new Size(20, 20)
        if (cons.layout === 'grow') {
            size = new Size(cons.space.w, 20)
        }
        if (cons.layout === 'shrink') {
            size = new Size(20, 20)
        }
        return new GRenderNode({
            baseline: 0,
            borderColor: "cyan",
            borderWidth: new Insets(1, 1, 1, 1),
            children: [],
            font: "",
            id: "h-expander",
            margin: ZERO_INSETS,
            padding: ZERO_INSETS,
            pos: ZERO_POINT,
            size: size,
            text: "",
            textColor: "",
            background: Style.panelBackgroundColor,
            contentOffset: new Point(0, 0),
        })
    }
}

function addInsets(a: Insets, b: Insets) {
    return new Insets(
        a.top+b.top,
        a.right+b.right,
        a.bottom+b.bottom,
        a.left + b.left
    )
}

function insetsWidth(insets: Insets) {
    return insets.left + insets.right
}
function insetsHeight(insets: Insets) {
    return insets.top + insets.bottom
}

export class MVBoxElement extends BoxElementBase implements GElement {

    constructor(param: BoxParameters) {
        super({
            id: param.id || 'vbox',
            mainAxisSelfLayout: withFallback(param.mainAxisSelfLayout,'shrink'),
            crossAxisSelfLayout: withFallback(param.crossAxisSelfLayout,'shrink'),
            crossAxisLayout: withFallback(param.crossAxisLayout, 'start'),
            mainAxisLayout: withFallback(param.mainAxisLayout,'center'),
            children: param.children,

            background: withFallback(param.background,Style.panelBackgroundColor),
            margin: withFallback(param.margin,Style.panelMargin),
            padding: withFallback(param.padding,Style.panelPadding),

            borderRadius: withFallback(param.borderRadius,0),
            borderWidth: withFallback(param.borderWidth,Style.panelBorderWidth),
            borderColor: withFallback(param.borderColor,Style.panelBorderColor),

            handleEvent: param.handleEvent,
            fixedWidth: param.fixedWidth,
            fixedHeight: param.fixedHeight,
        })
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        this.log("space = ", cons.layout, cons.space)

        let chs = this.settings.children
        // let map = new Map<GElement, GRenderNode>()
        // let expanders = chs.filter(ch => ch instanceof HExpander)
        // let non_expanders = chs.filter(ch => !(ch instanceof HExpander))
        // this.log(`exp ${expanders.length} non = ${non_expanders.length}`)

        let fullBounds = new Bounds(0,0,0,0)
        if(this.settings.mainAxisSelfLayout === 'grow') {
            fullBounds.h = cons.space.h
        }
        if(this.settings.mainAxisSelfLayout === 'shrink') {
            fullBounds.h = cons.space.h
        }
        if(this.settings.crossAxisSelfLayout === 'grow') {
            fullBounds.w = cons.space.w
        }
        if(this.settings.crossAxisSelfLayout === 'shrink') {
            fullBounds.w = cons.space.w
        }
        if(this.settings.fixedWidth) {
            fullBounds.w = this.settings.fixedWidth
        }
        let contentBounds = fullBounds.copy()
        contentBounds = this.subtractInsets(contentBounds)
        this.log(this.settings.id,fullBounds,contentBounds)

        // layout children
        let children = chs.map(ch => {
            return ch.layout(rc, {
                space: contentBounds.size(),
                layout: this.settings.mainAxisSelfLayout
            })
        })

        // position children
        let y = contentBounds.y
        let x = contentBounds.x
        for(let ch of children) {
            ch.settings.pos.y = y
            ch.settings.pos.x = x
            y += ch.settings.size.h
        }

        //resize myself back out
        let total_children_length = 0
        let max_child_size = 0
        for(let ch of children) {
            total_children_length += ch.settings.size.h
            max_child_size = Math.max(max_child_size, ch.settings.size.w)
        }
        let total_insets = this.getTotalInsets()
        if(this.settings.mainAxisSelfLayout === 'shrink') {
            fullBounds.h = total_children_length +  insetsHeight(total_insets)
        }
        if(this.settings.crossAxisSelfLayout === 'shrink') {
            fullBounds.w = max_child_size + insetsWidth(total_insets)
        }
        this.log("using fixed width",this.settings.fixedWidth)
        if(this.settings.fixedWidth) {
            fullBounds.w = this.settings.fixedWidth
        }

        return new GRenderNode({
            ... this.settings,
            baseline: 0,
            children: children,
            contentOffset: new Point(5,5),
            font: "",
            id: this.settings.id,
            pos: new Point(0,0),
            size: fullBounds.size(),
            text: "",
            textColor: ""

        })
    }

}
