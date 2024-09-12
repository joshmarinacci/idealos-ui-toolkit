import {GElement, GRenderNode, LayoutConstraints, MGlobals, MMouseEvent, ZERO_INSETS, ZERO_POINT} from "./base.js";
import {RenderContext} from "./gfx.js";
import {Bounds, Insets, Point, Size} from "josh_js_util";
import {Style} from "./style.js";
import {IconButton} from "./buttons.js";
import {Icons} from "./icons.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {KEY_VENDOR} from "./keys.js";


type MWindowOptions = {
    child:GElement
    initSize?:Size
}

class MWindowElement implements GElement {
    private child: GElement;
    private initSize: Size;

    constructor(opts: MWindowOptions) {
        this.child = opts.child
        this.initSize = opts.initSize || new Size(600,400)
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        let key = KEY_VENDOR.getKey()
        KEY_VENDOR.startElement(this)
        const cache:StateCache =  MGlobals.get(STATE_CACHE);
        const state = cache.getState(key)
        const [size,setSize] = state.useState("window-size",() => this.initSize)
        const [down,setDown] = state.useState("window-size-down",() => false)


        const borderWidth = Insets.from(5)
        let contentBounds = Bounds.fromPointSize(new Point(0,0),size).shrinkInsets(borderWidth)
        let child = this.child.layout(rc, {
            space: contentBounds.size(),
            layout: 'grow',
        })
        child.settings.pos = contentBounds.position()
        const startResize = (e: MMouseEvent) => {
            // console.log("start resize")
            setDown(true)
            e.redraw()
        }
        const doResize = (e: MMouseEvent) => {
            if(down) {
                // console.log("do resize",e.position)
                let size2 = size.copy()
                size2.w = e.position.x
                size2.h = e.position.y
                setSize(size2)
                e.redraw()
            }
        }
        const endResize = (_e: MMouseEvent) => {
            // console.log("ending the resize")
            setDown(false)
        }
        const resize = IconButton({
            icon:Icons.Resize,
            handleEvent: (e) => {
                if(e.type === 'mouse-down') {
                    startResize(e)
                }
                if(e.type === 'mouse-move') {
                    doResize(e)
                }
                if(e.type === 'mouse-up') {
                    endResize(e)
                }
            }
        }).layout(rc, cons)
        resize.settings.kind = 'resize-button'
        resize.settings.pos = size.asPoint().subtract(new Point(50,50))
        KEY_VENDOR.endElement(this)
        return new GRenderNode({
            padding: ZERO_INSETS,
            baseline: 0,
            borderWidth: borderWidth,
            children: [child, resize],
            contentOffset: ZERO_POINT.copy(),
            font: "",
            kind: "window",
            pos: new Point(0, 0),
            size: size,
            text: "",
            clip: true,
            key: key,
            visualStyle: {
                background: 'magenta',
                borderColor: 'black',
                textColor: Style.base().textColor
            }
        })
    }

}

export function MWindow(opts: MWindowOptions) {
    return new MWindowElement(opts)
}
