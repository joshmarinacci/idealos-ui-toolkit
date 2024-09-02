import {CEvent, GElement, GRenderNode, LayoutConstraints, TRANSPARENT, useState, ZERO_INSETS, ZERO_POINT} from "./base.js";
import {Bounds, Insets, Point, Size} from "josh_js_util";
import {RenderContext} from "./gfx.js";
import {IconButton} from "./buttons.js";
import {Icons} from "./icons.js";
import {KEY_VENDOR} from "./keys.js";
import {Style} from "./style.js";
import {bdsSubInsets} from "./util.js";

export type ScrollContainerSettings = {
    fixedWidth?: number,
    fixedHeight?: number,
    child: GElement,
}

class ScrollContainerElement implements GElement {
    private param: ScrollContainerSettings

    constructor(param: ScrollContainerSettings) {
        this.param = param
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        let key = KEY_VENDOR.getKey()
        const [scrollOffset, setScrollOffset] = useState(key,"scrollOffset",undefined, () => new Point(0,0))
        let borderInsets = Style.panel().borderWidth
        let w = cons.space.w
        if(this.param.fixedWidth) w = this.param.fixedWidth
        let h = cons.space.h
        if(this.param.fixedHeight) h = this.param.fixedHeight
        const fullBounds = new Bounds(0, 0, w, h)
        KEY_VENDOR.startElement(this)
        const contentBounds = bdsSubInsets(fullBounds, borderInsets)
        const barInsets = new Insets(0,10,10,0)
        const child_size = contentBounds.size()
        child_size.w -= barInsets.right
        child_size.h -= barInsets.bottom
        let child = this.param.child.layout(rc, {
            space: child_size,
            layout: "grow",
        })

        let os = (offset:Point, e:CEvent) => {
            if(e.type === 'mouse-down' || e.type === 'wheel') {
                setScrollOffset(offset)
                e.redraw()
            }
        }
        ;//this.param.onScrollChanged
        let children = [child]
        {
            // bottom scroll bar
            let key =  KEY_VENDOR.getKey()
            let bar = new GRenderNode({
                key:key,
                size: new Size(contentBounds.w-barInsets.right,barInsets.bottom),
                pos: contentBounds.bottom_left().subtract(new Point(0,barInsets.right)),
                baseline: 0,
                borderWidth: ZERO_INSETS,
                children: [],
                contentOffset: ZERO_POINT,
                font: "",
                kind: "",
                padding: ZERO_INSETS,
                text: "",
                visualStyle: {
                    borderColor: TRANSPARENT,
                    background: 'magenta',
                    textColor: 'magenta'
                }
            })
            children.push(bar)
        }
        {
            // right scroll bar
            let key =  KEY_VENDOR.getKey()
            let bar = new GRenderNode({
                key:key,
                size: new Size(barInsets.right,contentBounds.h - barInsets.bottom),
                pos: contentBounds.top_right().subtract(new Point(barInsets.right,0)),
                baseline: 0,
                borderWidth: ZERO_INSETS,
                children: [],
                contentOffset: ZERO_POINT,
                font: "",
                kind: "",
                padding: ZERO_INSETS,
                text: "",
                visualStyle: {
                    borderColor: TRANSPARENT,
                    background: 'magenta',
                    textColor: 'magenta'
                }
            })
            children.push(bar)
        }

        const iconSettings = {
            fontSize: 14,
            ghost: false,
            padding: ZERO_INSETS,
            borderRadius: ZERO_INSETS,
        }
        {
            // left button
            let button = IconButton({
                icon: Icons.KeyboardArrowLeft,
                handleEvent: (e) => os(this.addToOffset(scrollOffset, new Point(10, 0), child.settings.size, contentBounds), e),
                ...iconSettings,
            })
            let node = button.layout(rc, cons)
            node.settings.size = new Size(barInsets.right, barInsets.bottom)
            node.settings.pos.x = contentBounds.left()
            node.settings.pos.y = contentBounds.bottom() - node.settings.size.h
            children.push(node)
        }
        {
            // right button
            let button = IconButton({icon: Icons.KeyboardArrowRight,
                ...iconSettings,
            })
            let node = button.layout(rc, cons)
            node.settings.size = new Size(barInsets.right, barInsets.bottom)
            node.settings.pos.x = contentBounds.right() - node.settings.size.w - barInsets.right
            node.settings.pos.y = contentBounds.bottom() - node.settings.size.h
            children.push(node)
            node.settings.handleEvent = (e) => os(this.addToOffset(scrollOffset,new Point(-10, 0), child.settings.size, contentBounds), e)
        }
        {
            let button = IconButton({icon: Icons.KeyboardArrowUp,
                ...iconSettings,
            })
            let node = button.layout(rc, cons)
            node.settings.size = new Size(barInsets.right, barInsets.bottom)
            node.settings.pos.x = contentBounds.right() - node.settings.size.w
            node.settings.pos.y = contentBounds.top()
            children.push(node)
            node.settings.handleEvent = (e) => os(this.addToOffset(scrollOffset,new Point(0, 10), child.settings.size, contentBounds), e)
        }
        {
            let button = IconButton({icon: Icons.KeyboardArrowDown,
                ...iconSettings,
            })
            let node = button.layout(rc, cons)
            node.settings.size = new Size(barInsets.right, barInsets.bottom)
            node.settings.pos.x = contentBounds.right() - node.settings.size.w
            node.settings.pos.y = contentBounds.bottom() - node.settings.size.h - barInsets.bottom
            children.push(node)
            node.settings.handleEvent = (e) => os(this.addToOffset(scrollOffset,new Point(0, -10), child.settings.size, contentBounds), e)
        }

        child.settings.pos = scrollOffset.add(contentBounds.position())
        KEY_VENDOR.endElement(this)
        let node = new GRenderNode({
            kind: 'scroll',
            key:key,
            size: fullBounds.size(),
            visualStyle: {
                background: Style.panel().backgroundColor,
                borderColor: Style.button().borderColor,
                textColor: Style.panel().textColor,
            },
            baseline: 0,
            borderWidth: borderInsets,
            borderRadius: undefined,
            children: children,
            contentOffset: ZERO_POINT,
            font: "",
            padding: ZERO_INSETS,
            pos: fullBounds.position(),
            text: "",
            clip: true,
            canScroll:true,
            handleEvent: (e) => {
                if(e.type === 'wheel') {
                    os(this.addToOffset(scrollOffset,new Point(-e.deltaX,-e.deltaY), child.settings.size, contentBounds), e)
                }
            }
        })
        return node
    }


    private addToOffset(scrollOffset:Point, moveBy: Point, size: Size, contentBounds: Bounds) {
        let off = scrollOffset//.param.scrollOffset
        let newOff = off.add(moveBy)
        if (size.w < contentBounds.size().w) {
            newOff.x = 0
        } else {
            if (newOff.x > 0) {
                newOff.x = 0
            }
            if (newOff.x + size.w < contentBounds.size().w) {
                newOff.x = contentBounds.size().w - size.w
            }
        }

        if (size.h < contentBounds.size().h) {
            newOff.y = 0
        } else {
            if (newOff.y > 0) {
                newOff.y = 0
            }
            if (newOff.y + size.h < contentBounds.size().h) {
                newOff.y = contentBounds.size().h - size.h
            }
        }

        return newOff
    }
}

export function ScrollContainer(param: {
    fixedWidth?: number;
    fixedHeight?: number;
    child: GElement
}): GElement {
    return new ScrollContainerElement(param)
}
