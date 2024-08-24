import {GElement, GRenderNode, LayoutConstraints, MGlobals, MMouseEvent, ZERO_INSETS, ZERO_POINT} from "./base.ts";
import {RenderContext, withInsets} from "./gfx.ts";
import {Bounds, Point, Size} from "josh_js_util";
import {Style} from "./style.ts";
import {bdsSubInsets} from "./layout.ts";
import {IconButton} from "./buttons.ts";
import {Icons} from "./icons.ts";
import {STATE_CACHE, StateCache} from "./state.ts";
import {KEY_VENDOR} from "./keys.ts";

class MWindowElement implements GElement {
    private child: GElement;

    constructor(param: { child: GElement }) {
        const cache:StateCache =  MGlobals.get(STATE_CACHE);
        cache.startElement('window')
        this.child = param.child
        cache.endElement('window')
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        let key = KEY_VENDOR.getKey()
        KEY_VENDOR.startElement(this)
        const cache:StateCache =  MGlobals.get(STATE_CACHE);
        cache.startLayout('window')
        const [size,setSize] = cache.useState("window-size",() => new Size(500,300))
        const [down,setDown] = cache.useState("window-size-down",() => false)


        const borderWidth = withInsets(5)
        let contentBounds = bdsSubInsets(Bounds.fromPointSize(new Point(0,0),size),borderWidth)
        let child = this.child.layout(rc, {
            space: contentBounds.size(),
            layout: 'grow',
        })
        child.settings.pos = contentBounds.position()
        const startResize = (e: MMouseEvent) => {
            setDown(true)
            e.redraw()
        }
        const doResize = (e: MMouseEvent) => {
            if(down) {
                let size2 = size.copy()
                size2.w = e.position.x
                size2.h = e.position.y
                setSize(size2)
                e.redraw()
            }
        }
        const endResize = (e: MMouseEvent) => {
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
        let node = new GRenderNode({
            inputid: "window",
            margin: ZERO_INSETS,
            padding: ZERO_INSETS,
            baseline: 0,
            borderWidth: borderWidth,
            children: [child,resize],
            // children:[],
            contentOffset: ZERO_POINT.copy(),
            font: "",
            kind: "window",
            pos: new Point(0,0),
            size: size,
            text: "",
            clip: true,
            key:key,
            visualStyle: {
                background: 'magenta',
                borderColor: 'black',
                textColor: Style.textColor
            }

        })

        cache.endLayout('window')
        return node
    }

}

export function MWindow(param: { child: GElement }) {
    return new MWindowElement(param)
}
