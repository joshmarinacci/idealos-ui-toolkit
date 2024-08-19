import {CEvent, GElement, GRenderNode, LayoutConstraints, ZERO_INSETS, ZERO_POINT} from "./base.ts";
import {Bounds, Point, Size} from "josh_js_util";
import {RenderContext, withInsets} from "./gfx.ts";
import {IconButton} from "./buttons.ts";
import {Icons} from "./icons.ts";
import {bdsSubInsets} from "./layout.ts";

export type ScrollContainerSettings = {
    fixedWidth: number,
    fixedHeight: number,
    child: GElement,
    scrollOffset: Point,
    onScrollChanged: (newOffset: Point, e: CEvent) => void
}

class ScrollContainerElement implements GElement {
    private param: ScrollContainerSettings

    constructor(param: ScrollContainerSettings) {
        this.param = param
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        let borderInsets = withInsets(1)
        const fullBounds = new Bounds(0, 0, this.param.fixedWidth, this.param.fixedHeight)
        let child = this.param.child.layout(rc, {
            space: fullBounds.size(),
            layout: "grow",
        })
        const contentBounds = bdsSubInsets(fullBounds, borderInsets)

        let os = this.param.onScrollChanged
        let children = [child]
        {
            // left button
            let button = IconButton({
                icon: Icons.KeyboardArrowLeft, ghost: true,
                handleEvent: (e) => {
                    this.param.onScrollChanged(this.addToOffset(new Point(10, 0), child.settings.size, contentBounds), e)
                },
                margin: ZERO_INSETS
            })
            let node = button.layout(rc, cons)
            node.settings.pos.x = contentBounds.left()
            node.settings.pos.y = contentBounds.bottom() - node.settings.size.h
            children.push(node)
        }
        {
            // right button
            let button = IconButton({icon: Icons.KeyboardArrowRight, ghost: true})
            let rightr = button.layout(rc, cons)
            rightr.settings.pos.x = contentBounds.left() + rightr.settings.size.w
            rightr.settings.pos.y = contentBounds.bottom() - rightr.settings.size.h
            children.push(rightr)
            rightr.settings.handleEvent = (e) => os(this.addToOffset(new Point(-10, 0), child.settings.size, contentBounds), e)
        }


        {
            let button = IconButton({icon: Icons.KeyboardArrowUp, ghost: true})
            let node = button.layout(rc, cons)
            node.settings.pos.x = contentBounds.right() - node.settings.size.w
            node.settings.pos.y = contentBounds.top()
            children.push(node)
            node.settings.handleEvent = (e) => os(this.addToOffset(new Point(0, 10), child.settings.size, contentBounds), e)
        }

        {
            let button = IconButton({icon: Icons.KeyboardArrowDown, ghost: true})
            let node = button.layout(rc, cons)
            node.settings.pos.x = contentBounds.right() - node.settings.size.w
            node.settings.pos.y = contentBounds.top() + node.settings.size.h
            children.push(node)
            node.settings.handleEvent = (e) => os(this.addToOffset(new Point(0, -10), child.settings.size, contentBounds), e)
        }

        child.settings.pos = this.param.scrollOffset.add(contentBounds.position())

        return new GRenderNode({
            id: 'scroll',
            size: fullBounds.size(),
            visualStyle: {
                background: "magenta",
                borderColor: "yellow",
                textColor: "white",
            },
            baseline: 0,
            borderWidth: borderInsets,
            children: children,
            contentOffset: ZERO_POINT,
            font: "",
            margin: ZERO_INSETS,
            padding: ZERO_INSETS,
            pos: fullBounds.position(),
            text: "",
            clip: true,
            canScroll:true,
            handleEvent: (e) => {
                if(e.type === 'wheel') {
                    os(this.addToOffset(new Point(-e.deltaX,-e.deltaY), child.settings.size, contentBounds), e)
                }
            }
        })
    }


    private addToOffset(moveBy: Point, size: Size, contentBounds: Bounds) {
        let off = this.param.scrollOffset
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
    fixedWidth: number;
    onScrollChanged: (newOffset: Point, e: CEvent) => void;
    scrollOffset: Point;
    fixedHeight: number;
    child: GElement
}): GElement {
    return new ScrollContainerElement(param)
}
