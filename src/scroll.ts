import {CEvent, GElement, GRenderNode, LayoutConstraints, TRANSPARENT, useState, ZERO_INSETS, ZERO_POINT} from "./base.js";
import {Bounds, Insets, Point, Size} from "josh_js_util";
import {RenderContext} from "./gfx.js";
import {KEY_VENDOR} from "./keys.js";
import {Style} from "./style.js";

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
        const [down,setDown] = useState(key,"window-size-down",undefined,() => false)

        let borderInsets = Style.panel().borderWidth
        let w = cons.space.w
        if(this.param.fixedWidth) w = this.param.fixedWidth
        let h = cons.space.h
        if(this.param.fixedHeight) h = this.param.fixedHeight
        const fullBounds = new Bounds(0, 0, w, h)
        KEY_VENDOR.startElement(this)


        const contentBounds = fullBounds.shrinkInsets(borderInsets)
        const barInsets = new Insets(0,10,10,0)
        const child_size = contentBounds.size()
        child_size.w -= barInsets.right
        child_size.h -= barInsets.bottom

        const viewport_size = new Size(contentBounds.w-barInsets.right,
            contentBounds.h-barInsets.bottom)

        // console.log('child size',child_size)
        // console.log("viewport size",viewport_size)
        let child = this.param.child.layout(rc, {
            space: child_size,
            layout: "grow",
        })

        let os = (offset:Point, e:CEvent) => {
            if(e.type === 'mouse-down' || e.type === 'wheel' || e.type === 'mouse-move') {
                setScrollOffset(offset)
                e.redraw()
            }
        }
        let children = [child]
        let ah = child.settings.size.h
        let vh = viewport_size.h
        let y_fract = vh/ah
        // console.log("actual height",ah,"viewport height",vh,"off",scrollOffset.y,"fract",y_fract)
        let y_enabled = true
        if(y_fract > 1) {
            y_enabled = false
        }
        let y_thumb_h = vh*y_fract
        // console.log("ythumbh",y_thumb_h)
        const y_thumb_size = new Size(barInsets.right,y_thumb_h)
        const y_thumb_y = -scrollOffset.y * y_fract

        function addDelta(point: Point) {
            let off = scrollOffset.copy().add(point)
            if(off.y > 0) off.y = 0
            if(off.y + ah < vh) off.y = vh - ah
            return off
        }
        {
            let key = KEY_VENDOR.getKey()
            let thumb = new GRenderNode({
                key:key,
                size: y_thumb_size,
                pos: new Point(contentBounds.w-barInsets.right,y_thumb_y),
                baseline:0,
                borderWidth: ZERO_INSETS,
                children: [],
                contentOffset: ZERO_POINT,
                font: "",
                kind: "scroll-thumb",
                padding: ZERO_INSETS,
                text: "",
                visualStyle:{
                    borderColor: TRANSPARENT,
                    background: y_enabled?'cyan':'#ccc',
                    textColor: 'magenta'
                },
                handleEvent:(e) => {
                    if(e.type === 'mouse-down') {
                        setDown(true)
                        e.redraw()
                        return
                    }
                    if(e.type === 'mouse-move' && down) {
                        os(addDelta(new Point(0,-e.delta.y/y_fract)),e)
                    }
                    if(e.type === 'mouse-up') {
                        setDown(false)
                    }
                }
            })
            children.push(thumb)
        }
        // {
        //     // debug overlay
        //     children.push(Button({
        //         fontSettings: {
        //             font: Style.button().font,
        //             fontWeight: Style.button().fontWeight,
        //             fontSize: 12,
        //         },
        //         padding: ZERO_INSETS,
        //         text:""+scrollOffset.toString()
        //     }).layout(rc,cons))
        // }

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
                    os(addDelta(new Point(0,-e.deltaY)),e)
                }
            }
        })
        // console.log("self bounds", node.settings.size)
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
