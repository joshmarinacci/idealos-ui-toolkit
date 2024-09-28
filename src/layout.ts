import {
    AxisLayout,
    AxisSelfLayout,
    ElementSettings,
    GElement,
    GRenderNode,
    LayoutConstraints,
    TRANSPARENT,
    VisualStyle,
    ZERO_INSETS,
    ZERO_POINT
} from "./base.js";
import {RenderContext} from "./gfx.js";
import {Bounds, Insets, Logger, make_logger, Point, Size} from "josh_js_util";
import {Style} from "./style.js";
import {KEY_VENDOR} from "./keys.js";
import {getTotalInsets, withX, withY, withFallback} from "./util.js";
import {TextInputElement} from "./textinput.js";

export type BoxRequirements = {
    kind:string,
    mainAxisSelfLayout: AxisSelfLayout,
    crossAxisSelfLayout: AxisSelfLayout,
    mainAxisLayout: AxisLayout,
    crossAxisLayout: AxisLayout,
    children: GElement[],
    fixedWidth?: number
    fixedHeight?: number
    visualStyle: VisualStyle
    clip?:boolean
} & ElementSettings

export type BoxOptions = {
    fixedWidth?: number
    fixedHeight?: number
    mainAxisSelfLayout?: AxisSelfLayout,
    crossAxisSelfLayout?: AxisSelfLayout,
    mainAxisLayout?: AxisLayout,
    crossAxisLayout?: AxisLayout,
    children: GElement[],
    visualStyle?: VisualStyle
    clip?:boolean
} & ElementSettings;

export type BoxConstraints = {
    fixedWidth?: number
    fixedHeight?: number
    mainAxisSelfLayout: AxisSelfLayout,
    crossAxisSelfLayout: AxisSelfLayout,
    mainAxisLayout: AxisLayout,
    crossAxisLayout: AxisLayout,
}
class BoxElementBase {
    protected settings: BoxRequirements;
    log: Logger;

    constructor(settings: BoxRequirements) {
        this.settings = settings
        this.log = make_logger(this.settings.kind)
        this.log.setEnabled(false)
    }

    protected getConstraints():BoxConstraints {
        return {
            mainAxisSelfLayout: this.settings.mainAxisSelfLayout,
            mainAxisLayout: this.settings.mainAxisLayout,
            crossAxisSelfLayout: this.settings.crossAxisSelfLayout,
            crossAxisLayout: this.settings.crossAxisLayout,
            fixedWidth: this.settings.fixedWidth,
            fixedHeight: this.settings.fixedHeight,
        }
    }

    protected isVExpand(ch: GElement) {
        if (ch instanceof MVBoxElement) {
            let vbox = ch as MVBoxElement
            if (vbox.settings.mainAxisSelfLayout === 'grow' && !vbox.settings.fixedHeight) {
                return true
            }
        }
        return false
    }
    protected isHExpand(ch: GElement) {
        if (ch instanceof MHBoxElement) {
            let hbox = ch as MHBoxElement
            if (hbox.settings.mainAxisSelfLayout === 'grow' && !hbox.settings.fixedHeight) {
                return true
            }
        }
        if(ch instanceof HExpander) return true
        if(ch instanceof TextInputElement) return true
        return false
    }
}

export class MHBoxElement extends BoxElementBase implements GElement {

    constructor(param: BoxOptions) {
        super({
            ...param,
            kind: param.kind || "hbox",
            borderRadius: param.borderRadius || ZERO_INSETS,
            mainAxisSelfLayout: withFallback(param.mainAxisSelfLayout, 'shrink'),
            crossAxisSelfLayout: withFallback(param.crossAxisSelfLayout, 'shrink'),
            crossAxisLayout: withFallback(param.crossAxisLayout, 'start'),
            mainAxisLayout: withFallback(param.mainAxisLayout, 'center'),
            visualStyle: param.visualStyle || {
                background: Style.panel().backgroundColor,
                textColor: Style.panel().textColor,
                borderColor:  Style.panel().borderColor,
            },
            padding: withFallback(param.padding, Style.panel().padding),
            borderWidth: withFallback(param.borderWidth, Style.panel().borderWidth),
        })
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        this.log.info(`space`,cons)
        if (this.settings.mainAxisSelfLayout === 'grow') {
            return this.do_grow_layout(rc, cons)
        }
        if (this.settings.mainAxisSelfLayout == 'shrink') {
            return this.do_shrink_layout(rc, cons)
        }
        throw new Error(`unknown self layout type ${this.settings.mainAxisSelfLayout}`)
    }

    private do_grow_layout(rc: RenderContext, cons: LayoutConstraints) {
        let key = this.settings.key || KEY_VENDOR.getKey()
        let fullBounds = new Bounds(0, 0, 0, 0)

        fullBounds.w = cons.space.w
        if (this.settings.fixedWidth) fullBounds.w = this.settings.fixedWidth
        if (this.settings.crossAxisSelfLayout === 'grow') fullBounds.h = cons.space.h
        let contentBounds = fullBounds.shrinkInsets(getTotalInsets(this.settings))


        let chs = this.settings.children
        let expanders = chs.filter(ch => this.isHExpand(ch))
        let non_expanders = chs.filter(ch => !(this.isHExpand(ch)))
        let map = new Map<GElement, GRenderNode>()

        let metrics:LayoutMetrics = {
            non_expander_total_length:0,
            total_children_length:0,
            max_child_height:0,
            max_child_width:0,
        }

        // layout the non expander children
        non_expanders.map(ch => {
            let node = ch.layout(rc, {
                space: contentBounds.size(),
                layout: this.settings.mainAxisSelfLayout,
            })
            map.set(ch, node)
            metrics.non_expander_total_length += node.settings.size.w
            metrics.max_child_width = Math.max(node.settings.size.w, metrics.max_child_width)
            metrics.max_child_height = Math.max(node.settings.size.h, metrics.max_child_height)
        })

        // layout the expander children
        let leftover_per_child = (contentBounds.w - metrics.non_expander_total_length) / expanders.length
        expanders.map(ch => {
            let node = ch.layout(rc, {
                space: new Size(leftover_per_child, contentBounds.h),
                layout: this.settings.mainAxisSelfLayout,
            })
            metrics.max_child_width = Math.max(node.settings.size.w, metrics.max_child_width)
            metrics.max_child_height = Math.max(node.settings.size.h, metrics.max_child_height)
            map.set(ch, node)
        })

        // calculate the total children length
        chs.map(ch => map.get(ch) as GRenderNode)
            .forEach(ch => metrics.total_children_length += ch.settings.size.w)

        if (this.settings.crossAxisSelfLayout === 'shrink') contentBounds.h = metrics.max_child_height

        if(this.settings.fixedHeight) contentBounds.h = this.settings.fixedHeight

        // position all children
        this.do_main_layout_position(contentBounds, map, metrics)
        this.do_cross_layout_position(contentBounds,  map)

        // look up the laid out children
        let children = this.settings.children.map(ch => map.get(ch) as GRenderNode)
        fullBounds = contentBounds.growInsets(getTotalInsets(this.settings))
        this.log.info(`content bounds ${contentBounds}`)
        this.log.info   (`full bounds ${fullBounds}`)
        return new GRenderNode({
            ...this.settings,
            baseline: 0,
            font: Style.panel().font,
            pos: new Point(0, 0),
            size: fullBounds.size(),
            text: "",
            children,
            contentOffset: contentBounds.position(),
            key,
        }, {
            'constraints': this.getConstraints(),
        })
    }

    private do_shrink_layout(rc: RenderContext, cons: LayoutConstraints) {
        let key = this.settings.key || KEY_VENDOR.getKey()
        let chs = this.settings.children
        let map = new Map<GElement, GRenderNode>()


        let fullBounds = new Bounds(0, 0, 0, 0)
        fullBounds.w = cons.space.w
        fullBounds.h = cons.space.h
        if (this.settings.fixedWidth) fullBounds.w = this.settings.fixedWidth
        if (this.settings.fixedHeight) fullBounds.h = this.settings.fixedHeight
        if (this.settings.crossAxisSelfLayout === 'grow') fullBounds.h = cons.space.h
        if (this.settings.crossAxisSelfLayout === 'shrink') fullBounds.h = cons.space.h
        let contentBounds = fullBounds.shrinkInsets(getTotalInsets(this.settings))

        let metrics:LayoutMetrics = {
            non_expander_total_length:0,
            total_children_length:0,
            max_child_height:0,
            max_child_width:0,
        }

        KEY_VENDOR.startElement(this)
        // layout all children.
        chs.forEach(ch => {
            const node = ch.layout(rc, {
                space: contentBounds.size(),
                layout: this.settings.mainAxisSelfLayout,
            })
            map.set(ch, node)
            metrics.non_expander_total_length += node.settings.size.w
            metrics.total_children_length += node.settings.size.w
            metrics.max_child_width = Math.max(node.settings.size.w, metrics.max_child_width)
            metrics.max_child_height = Math.max(node.settings.size.h, metrics.max_child_height)
        })
        KEY_VENDOR.endElement(this)


        contentBounds.w = metrics.total_children_length
        if(this.settings.crossAxisSelfLayout === 'shrink') contentBounds.h = metrics.max_child_height
        fullBounds = contentBounds.growInsets(getTotalInsets(this.settings))
        // fullBounds = this.addInsets(contentBounds)
        this.log.info(`content bounds ${contentBounds}`)
        this.log.info(`full bounds ${fullBounds}`)

        // position all children
        this.do_cross_layout_position(contentBounds, map)
        this.do_main_layout_position(contentBounds,map,metrics)

        let children = chs.map(ch => map.get(ch) as GRenderNode)
        return new GRenderNode({
            ... this.settings,
            baseline: 0,
            font: Style.base().font,
            pos: new Point(0, 0),
            size: fullBounds.size(),
            text: "",
            children,
            contentOffset: contentBounds.position(),
            key,
        }, {
            'constraints': this.getConstraints(),
        })

    }

    private do_main_layout_position(contentBounds: Bounds, map: Map<GElement, GRenderNode>, metrics: LayoutMetrics) {
        let leftover = contentBounds.w - metrics.total_children_length
        let gap = 0
        let x = contentBounds.x

        let main = this.settings.mainAxisLayout
        if(main === 'start') x = contentBounds.x
        if(main === 'center') x = contentBounds.x + leftover / 2
        if(main === 'end') x = contentBounds.x + leftover
        if(main === 'between') gap = leftover / (this.settings.children.length - 1)

        this.log.info(`mainAxisLayout is ${this.settings.mainAxisLayout}`)
        this.log.info("starting x at",x)
        this.settings.children.forEach(ch => {
            let node = map.get(ch) as GRenderNode
            node.settings.pos = withX(node.settings.pos,x)
            x += node.settings.size.w
            x += gap
        })

    }

    private do_cross_layout_position(contentBounds: Bounds, map: Map<GElement, GRenderNode>) {
        let cross = this.settings.crossAxisLayout
        this.settings.children.forEach(ch => {
            let node = map.get(ch) as GRenderNode
            let y = 0
            if(cross === 'start') y = contentBounds.y
            if(cross === 'center') y = contentBounds.y + (contentBounds.h - node.settings.size.h) / 2
            if(cross === 'end') y = contentBounds.y + (contentBounds.h - node.settings.size.h)
            node.settings.pos = withY(node.settings.pos,y)
        })

    }
}

export class HExpander implements GElement {
    layout(_rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        const key = KEY_VENDOR.getKey()
        let size = new Size(20, 20)
        if (cons.layout === 'grow') {
            size = new Size(cons.space.w, 20)
        }
        if (cons.layout === 'shrink') {
            size = new Size(20, 20)
        }
        return new GRenderNode({
            shadow: true,
            key:key,
            baseline: 0,
            visualStyle: {
                background: TRANSPARENT,
                textColor: 'cyan',
                borderColor: TRANSPARENT,
            },
            borderWidth: new Insets(1, 1, 1, 1),
            children: [],
            font: "",
            kind: "h-expander",
            padding: ZERO_INSETS,
            pos: ZERO_POINT,
            size: size,
            text: "",
            contentOffset: new Point(0, 0),
        })
    }
}

type LayoutMetrics = {
    non_expander_total_length:number
    max_child_width: number
    max_child_height: number
    total_children_length:number
}

export class MVBoxElement extends BoxElementBase implements GElement {

    constructor(param: BoxOptions) {
        super({
            ...param,
            kind: param.kind || 'vbox',
            mainAxisSelfLayout: withFallback(param.mainAxisSelfLayout, 'shrink'),
            crossAxisSelfLayout: withFallback(param.crossAxisSelfLayout, 'shrink'),
            crossAxisLayout: withFallback(param.crossAxisLayout, 'start'),
            mainAxisLayout: withFallback(param.mainAxisLayout, 'start'),
            visualStyle: param.visualStyle || {
                background: Style.panel().backgroundColor,
                textColor: Style.base().textColor,
                borderColor: Style.panel().borderColor
            },
            padding: withFallback(param.padding, Style.panel().padding),
            borderRadius: withFallback(param.borderRadius, ZERO_INSETS),
            borderWidth: withFallback(param.borderWidth, Style.panel().borderWidth),
        })
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        this.log.info("space = ", cons.layout, cons.space)
        if (this.settings.mainAxisSelfLayout === 'grow') {
            return this.do_grow_layout(rc, cons)
        }
        if (this.settings.mainAxisSelfLayout == 'shrink') {
            return this.do_shrink_layout(rc, cons)
        }
        throw new Error(`unknown self layout type ${this.settings.mainAxisSelfLayout}`)
    }

    private do_grow_layout(rc: RenderContext, cons: LayoutConstraints) {
        let key = this.settings.key || KEY_VENDOR.getKey()
        let fullBounds = new Bounds(0, 0, 0, 0)
        fullBounds.h = cons.space.h
        if(this.settings.fixedHeight) fullBounds.h = this.settings.fixedHeight
        //width always takes up the available space, for now
        fullBounds.w = cons.space.w
        if(this.settings.fixedWidth) fullBounds.w = this.settings.fixedWidth

        let contentBounds = fullBounds.shrinkInsets(getTotalInsets(this.settings))

        // split the children into two groups
        let chs = this.settings.children
        let expanders = chs.filter(ch => this.isVExpand(ch))
        let non_expanders = chs.filter(ch => !(this.isVExpand(ch)))
        this.log.info(`exp ${expanders.length} non = ${non_expanders.length}`)

        // make a lookup table for the children
        let map = new Map<GElement, GRenderNode>()

        let metrics:LayoutMetrics = {
            non_expander_total_length:0,
            max_child_width:0,
            max_child_height:0,
            total_children_length: 0,
        }

        // layout the non-expander children first
        non_expanders.map(ch => {
            let node = ch.layout(rc, {
                space: contentBounds.size(),
                layout: this.settings.mainAxisSelfLayout,
            })
            metrics.non_expander_total_length += node.settings.size.h
            map.set(ch, node)
            metrics.max_child_width = Math.max(node.settings.size.w, metrics.max_child_width)
            metrics.max_child_height = Math.max(node.settings.size.h, metrics.max_child_height)
        })
        let leftover = contentBounds.h - metrics.non_expander_total_length
        let leftover_per_child = leftover / expanders.length

        // layout the expander children with the remaining space
        expanders.map(ch => {
            let node = ch.layout(rc, {
                space: new Size(contentBounds.w,leftover_per_child),
                layout: this.settings.mainAxisSelfLayout,
            })
            leftover -= leftover_per_child
            map.set(ch, node)
        })
        this.log.info(`final leftover is ${leftover}`)

        // calculate the total children length
        chs.map(ch => map.get(ch) as GRenderNode)
            .forEach(ch => metrics.total_children_length += ch.settings.size.h)


        // position all the children
        this.do_main_layout_position(contentBounds, map, metrics)
        this.do_cross_layout_position(contentBounds,  map)

        // look up the laid out children
        let children = this.settings.children.map(ch => map.get(ch) as GRenderNode)

        // if it should be shrink, then
        if (this.settings.crossAxisSelfLayout === 'shrink' && !this.settings.fixedWidth) {
            fullBounds.w = metrics.max_child_width + getTotalInsets(this.settings).width()
        }

        if(this.settings.mainAxisSelfLayout === 'grow') {
            fullBounds.h = metrics.total_children_length + getTotalInsets(this.settings).height()
        }

        this.log.info(`content bounds ${contentBounds}`)
        this.log.info   (`full bounds ${fullBounds}`)

        return new GRenderNode({
            ...this.settings,
            baseline: 0,
            font: Style.panel().font,
            pos: new Point(0, 0),
            size: fullBounds.size(),
            text: "",
            children,
            contentOffset: contentBounds.position(),
            key,
        }, {
            'constraints': this.getConstraints(),
        })

    }

    private do_main_layout_position(contentBounds: Bounds, map: Map<GElement, GRenderNode>, metrics: LayoutMetrics) {
        let leftover = contentBounds.h - metrics.total_children_length
        let gap = 0
        let y = contentBounds.y

        let main = this.settings.mainAxisLayout
        if(main === 'start') y = contentBounds.y
        if(main === 'center') y = contentBounds.y + leftover / 2
        if(main === 'end') y = contentBounds.y + leftover
        if(main === 'between') gap = leftover / (this.settings.children.length - 1)

        this.log.info(`mainAxisLayout is ${this.settings.mainAxisLayout}`)
        this.log.info("starting y at",y)
        this.settings.children.forEach(ch => {
            let node = map.get(ch) as GRenderNode
            node.settings.pos = withY(node.settings.pos,y)
            y += node.settings.size.h
            y += gap
        })
    }

    private do_cross_layout_position(contentBounds: Bounds, map: Map<GElement, GRenderNode>) {
        let cross = this.settings.crossAxisLayout
        this.settings.children.forEach(ch => {
            let node = map.get(ch) as GRenderNode
            let x = 0
            if(cross === 'start') x = contentBounds.x
            if(cross === 'center') x = contentBounds.x + (contentBounds.w - node.settings.size.w) / 2
            if(cross === 'end') x = contentBounds.x + (contentBounds.w - node.settings.size.w)
            node.settings.pos = withX(node.settings.pos,x)
        })
    }

    private do_shrink_layout(rc: RenderContext, cons: LayoutConstraints) {
        let key = this.settings.key || KEY_VENDOR.getKey()
        let chs = this.settings.children
        let map = new Map<GElement, GRenderNode>()

        let fullBounds = new Bounds(0, 0, 0, 0)
        fullBounds.h = cons.space.h
        if (this.settings.fixedWidth) fullBounds.w = this.settings.fixedWidth
        if (this.settings.fixedHeight) fullBounds.h = this.settings.fixedHeight
        if (this.settings.crossAxisSelfLayout === 'grow') fullBounds.w = cons.space.w
        if (this.settings.crossAxisSelfLayout === 'shrink') fullBounds.w = cons.space.w
        let contentBounds = fullBounds.shrinkInsets(getTotalInsets(this.settings))

        let metrics:LayoutMetrics = {
            non_expander_total_length:0,
            total_children_length:0,
            max_child_height:0,
            max_child_width:0,
        }

        KEY_VENDOR.startElement(this)
        // layout children
        chs.map(ch => {
            let node = ch.layout(rc, {
                space: contentBounds.size(),
                layout: this.settings.mainAxisSelfLayout
            })
            map.set(ch,node)
            metrics.non_expander_total_length += node.settings.size.h
            metrics.total_children_length += node.settings.size.w
            metrics.max_child_width = Math.max(node.settings.size.w, metrics.max_child_width)
            metrics.max_child_height = Math.max(node.settings.size.h, metrics.max_child_height)
        })
        KEY_VENDOR.endElement(this)

        this.do_main_layout_position(contentBounds, map, metrics)
        this.do_cross_layout_position(contentBounds,  map)


        let children = this.settings.children.map(ch => map.get(ch) as GRenderNode)
        // contentBounds.h = metrics.total_children_length
        fullBounds = contentBounds.growInsets(getTotalInsets(this.settings))

        return new GRenderNode({
            ...this.settings,
            key:key,
            baseline: 0,
            children,
            contentOffset: ZERO_POINT.copy(),
            font: "",
            pos: ZERO_POINT.copy(),
            size: fullBounds.size(),
            text: "",
        },{
            constraints:this.getConstraints()
        })
    }
}

export function HBox(param: BoxOptions) {
    return new MHBoxElement({
        ... param,
        kind: param.kind || "hbox",
        mainAxisSelfLayout: param.mainAxisSelfLayout || 'grow',
        mainAxisLayout: param.mainAxisLayout || 'start',
        crossAxisSelfLayout: param.crossAxisSelfLayout || 'shrink',
        crossAxisLayout: param.crossAxisLayout || 'start',
    })
}

export function VBox(param: BoxOptions) {
    return new MVBoxElement({
        ... param,
        kind: param.kind || "vbox",
        mainAxisSelfLayout: param.mainAxisSelfLayout || 'grow',
        mainAxisLayout: param.mainAxisLayout || 'start',
        crossAxisSelfLayout: param.crossAxisSelfLayout || 'shrink',
        crossAxisLayout: param.crossAxisLayout || 'start',
    })
}

export function HSpacer() {
    return new HExpander()
}
