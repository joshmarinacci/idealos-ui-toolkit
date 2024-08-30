import {
    AxisLayout,
    AxisSelfLayout,
    ElementSettings,
    GElement,
    GRenderNode,
    LayoutConstraints,
    TRANSPARENT, VisualStyle,
    ZERO_INSETS,
    ZERO_POINT
} from "./base.js";
import {RenderContext} from "./gfx.js";
import {Bounds, Insets, Point, Size} from "josh_js_util";
import {Style} from "./style.js";
import {bdsAddInsets, bdsSubInsets, getTotalInsets, insetsHeight, insetsWidth, withFallback} from "./util.js";
import {KEY_VENDOR} from "./keys.js";

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
} & ElementSettings;

class BoxElementBase {
    protected settings: BoxRequirements;
    private log_enabled: boolean;

    constructor(settings: BoxRequirements) {
        this.settings = settings
        this.log_enabled = false
    }

    // @ts-ignore
    protected log(...output: any[]) {
        if (this.log_enabled) console.log("HBox", ...output)
    }

    protected getConstraints() {
        return {
            mainAxisSelfLayout: this.settings.mainAxisSelfLayout,
            mainAxisLayout: this.settings.mainAxisLayout,
            crossAxisSelfLayout: this.settings.crossAxisSelfLayout,
            crossAxisLayout: this.settings.crossAxisLayout,
            fixedWidth: this.settings.fixedWidth,
            fixedHeight: this.settings.fixedHeight,
        }
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
            margin: withFallback(param.margin, Style.panel().margin),
            padding: withFallback(param.padding, Style.panel().padding),
            borderWidth: withFallback(param.borderWidth, Style.panel().borderWidth),
        })
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        this.log(`space`,cons)
        if (this.settings.mainAxisSelfLayout === 'grow') {
            return this.do_grow_layout(rc, cons)
        }
        if (this.settings.mainAxisSelfLayout == 'shrink') {
            return this.do_shrink_layout(rc, cons)
        }
        throw new Error(`unknown self layout type ${this.settings.mainAxisSelfLayout}`)
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

    private layout_between(chs: GElement[], map: Map<GElement, GRenderNode>, contentBounds: Bounds) {
        let max_child_height = 0
        let final_children_length = 0
        chs.forEach(ch => {
            let node = map.get(ch) as GRenderNode
            max_child_height = Math.max(node.settings.size.h, max_child_height)
            final_children_length += node.settings.size.w
        })
        let leftover = contentBounds.w - final_children_length
        let leftover_per_child = leftover / (chs.length - 1)
        let x = contentBounds.x
        chs.forEach(ch => {
            let node = map.get(ch) as GRenderNode
            node.settings.pos.x = x
            x += node.settings.size.w
            x += leftover_per_child
        })
    }

    private do_grow_layout(rc: RenderContext, cons: LayoutConstraints) {
        let key = this.settings.key || KEY_VENDOR.getKey()
        let fullBounds = new Bounds(0, 0, 0, 0)
        let contentBounds = new Bounds(0, 0, 0, 0)

        let chs = this.settings.children
        let expanders = chs.filter(ch => ch instanceof HExpander)
        let non_expanders = chs.filter(ch => !(ch instanceof HExpander))
        this.log(`exp ${expanders.length} non = ${non_expanders.length}`)
        let map = new Map<GElement, GRenderNode>()

        this.log("growing my width")
        contentBounds.w = cons.space.w
        fullBounds.w = cons.space.w

        if (this.settings.fixedWidth) {
            contentBounds.w = this.settings.fixedWidth
            fullBounds.w = this.settings.fixedWidth
        }

        if (this.settings.crossAxisSelfLayout === 'grow') {
            contentBounds.h = cons.space.h
            fullBounds.h = cons.space.h
        }

        // account for insets
        contentBounds = bdsSubInsets(contentBounds, getTotalInsets(this.settings))
        // contentBounds = this.subtractInsets(contentBounds)
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
        let final_children_length = 0
        chs.forEach(ch => {
            let node = map.get(ch) as GRenderNode
            max_child_height = Math.max(node.settings.size.h, max_child_height)
            final_children_length += node.settings.size.w
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
        if (this.settings.mainAxisLayout === 'between' && chs.length >= 2) {
            this.layout_between(chs, map, contentBounds)
        }
        let children = this.settings.children.map(ch => map.get(ch) as GRenderNode)
        fullBounds = bdsAddInsets(contentBounds, getTotalInsets(this.settings))
        // fullBounds = this.addInsets(contentBounds)
        this.log(`content bounds ${contentBounds}`)
        this.log(`full bounds ${fullBounds}`)
        return new GRenderNode({
            ...this.settings,
            kind:this.settings.kind || "hbox",
            baseline: 0,
            font: Style.panel().font,
            pos: new Point(0, 0),
            size: fullBounds.size(),
            text: "",
            children: children,
            contentOffset: contentBounds.position(),
            key: key,
        }, {
            'constraints': this.getConstraints(),
        })
    }

    private do_shrink_layout(rc: RenderContext, cons: LayoutConstraints) {
        let contentBounds = new Bounds(0, 0, 0, 0)
        let fullBounds = new Bounds(0, 0, 0, 0)
        let key = this.settings.key || KEY_VENDOR.getKey()
        let chs = this.settings.children
        let map = new Map<GElement, GRenderNode>()
        this.log('shrinking my width')
        contentBounds.w = cons.space.w
        fullBounds.w = cons.space.w
        contentBounds.h = cons.space.h
        fullBounds.h = cons.space.h
        if (this.settings.fixedWidth) {
            contentBounds.w = this.settings.fixedWidth
            fullBounds.w = this.settings.fixedWidth
        }
        contentBounds = bdsSubInsets(contentBounds, getTotalInsets(this.settings))
        // contentBounds = this.subtractInsets(contentBounds)
        this.log("started content bounds", contentBounds)
        // layout all children.
        KEY_VENDOR.startElement(this)
        chs.forEach(ch => {
            const node = ch.layout(rc, {
                space: contentBounds.size(),
                layout: this.settings.mainAxisSelfLayout,
            })
            map.set(ch, node)
        })
        KEY_VENDOR.endElement(this)

        let max_child_height = 0
        let child_total_width = 0
        // get total child bounds
        chs.forEach(ch => {
            let node = map.get(ch) as GRenderNode
            if(!node.settings.popup) {
                child_total_width += node.settings.size.w
                max_child_height = Math.max(max_child_height, node.settings.size.h)
            }
        })
        contentBounds.w = child_total_width
        contentBounds.h = max_child_height
        fullBounds = bdsAddInsets(contentBounds, getTotalInsets(this.settings))
        // fullBounds = this.addInsets(contentBounds)
        this.log(`content bounds ${contentBounds}`)
        this.log(`full bounds ${fullBounds}`)

        // position all children
        this.layout_nodes_cross_axis(chs, map, contentBounds)
        let x = contentBounds.x
        chs.forEach(ch => {
            let node = map.get(ch) as GRenderNode
            if(!node.settings.popup) {
                node.settings.pos.x = x
                x += node.settings.size.w
            }
        })

        let children = chs.map(ch => map.get(ch) as GRenderNode)
        return new GRenderNode({
            ... this.settings,
            baseline: 0,
            font: Style.base().font,
            pos: new Point(0, 0),
            size: fullBounds.size(),
            text: "",
            children: children,
            contentOffset: contentBounds.position(),
            key: key,
        }, {
            'constraints': this.getConstraints(),
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
            margin: ZERO_INSETS,
            padding: ZERO_INSETS,
            pos: ZERO_POINT,
            size: size,
            text: "",
            contentOffset: new Point(0, 0),
        })
    }
}

export class MVBoxElement extends BoxElementBase implements GElement {

    constructor(param: BoxOptions) {
        super({
            ...param,
            kind: param.kind || 'vbox',
            mainAxisSelfLayout: withFallback(param.mainAxisSelfLayout, 'shrink'),
            crossAxisSelfLayout: withFallback(param.crossAxisSelfLayout, 'shrink'),
            crossAxisLayout: withFallback(param.crossAxisLayout, 'start'),
            mainAxisLayout: withFallback(param.mainAxisLayout, 'center'),
            visualStyle: param.visualStyle || {
                background: Style.panel().backgroundColor,
                textColor: Style.base().textColor,
                borderColor: Style.panel().borderColor
            },
            margin: withFallback(param.margin, Style.panel().margin),
            padding: withFallback(param.padding, Style.panel().padding),
            borderRadius: withFallback(param.borderRadius, ZERO_INSETS),
            borderWidth: withFallback(param.borderWidth, Style.panel().borderWidth),
        })
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        this.log("space = ", cons.layout, cons.space)
        let key = this.settings.key || KEY_VENDOR.getKey()
        let chs = this.settings.children

        let fullBounds = new Bounds(0, 0, 0, 0)
        if (this.settings.mainAxisSelfLayout === 'grow') {
            fullBounds.h = cons.space.h
        }
        if (this.settings.mainAxisSelfLayout === 'shrink') {
            fullBounds.h = cons.space.h
        }
        if (this.settings.crossAxisSelfLayout === 'grow') {
            fullBounds.w = cons.space.w
        }
        if (this.settings.crossAxisSelfLayout === 'shrink') {
            fullBounds.w = cons.space.w
        }
        if (this.settings.fixedWidth) {
            fullBounds.w = this.settings.fixedWidth
        }
        let contentBounds = fullBounds.copy()
        contentBounds = bdsSubInsets(contentBounds, getTotalInsets(this.settings))
        this.log(this.settings.kind, fullBounds, contentBounds)

        KEY_VENDOR.startElement(this)
        // layout children
        let children = chs.map(ch => {
            return ch.layout(rc, {
                space: contentBounds.size(),
                layout: this.settings.mainAxisSelfLayout
            })
        })
        KEY_VENDOR.endElement(this)

        // position children
        let y = contentBounds.y
        let x = contentBounds.x
        for (let ch of children) {
            ch.settings.pos.y = y
            ch.settings.pos.x = x
            y += ch.settings.size.h
        }

        //resize myself back out
        let total_children_length = 0
        let max_child_size = 0
        for (let ch of children) {
            total_children_length += ch.settings.size.h
            max_child_size = Math.max(max_child_size, ch.settings.size.w)
        }
        let total_insets = getTotalInsets(this.settings)
        if (this.settings.mainAxisSelfLayout === 'shrink') {
            fullBounds.h = total_children_length + insetsHeight(total_insets)
        }
        if (this.settings.crossAxisSelfLayout === 'shrink') {
            fullBounds.w = max_child_size + insetsWidth(total_insets)
        }
        this.log("using fixed width", this.settings.fixedWidth)
        if (this.settings.fixedWidth) {
            fullBounds.w = this.settings.fixedWidth
        }

        return new GRenderNode({
            ...this.settings,
            key:key,
            baseline: 0,
            children: children,
            contentOffset: new Point(5, 5),
            font: "",
            kind: this.settings.kind,
            pos: new Point(0, 0),
            size: fullBounds.size(),
            text: "",
            borderWidth: this.settings.borderWidth,
            shadow: this.settings.shadow
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
