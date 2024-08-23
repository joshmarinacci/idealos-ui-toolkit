import {GElement, GRenderNode, LayoutConstraints, MGlobals, MMouseEvent, ZERO_INSETS, ZERO_POINT} from "./base.ts";
import {RenderContext, withInsets} from "./gfx.ts";
import {Bounds, Point, Size} from "josh_js_util";
import {Style} from "./style.ts";
import {bdsSubInsets} from "./layout.ts";
import {IconButton} from "./buttons.ts";
import {Icons} from "./icons.ts";
import {STATE_CACHE, StateCache} from "./state.ts";

class MWindowElement implements GElement {
    private child: GElement;

    constructor(param: { child: GElement }) {
        const cache:StateCache =  MGlobals.get(STATE_CACHE);
        cache.startElement('window')
        this.child = param.child
        cache.endElement('window')
    }

    layout(rc: RenderContext, cons: LayoutConstraints): GRenderNode {
        const cache:StateCache =  MGlobals.get(STATE_CACHE);
        cache.startLayout('window')
        const [size,setSize] = cache.useState("window-size",() => new Size(500,300))


        console.log("layout window",size)
        const borderWidth = withInsets(5)
        let contentBounds = bdsSubInsets(Bounds.fromPointSize(new Point(0,0),size),borderWidth)
        let child = this.child.layout(rc, {
            space: contentBounds.size(),
            layout: 'grow',
        })
        child.settings.pos = contentBounds.position()
        const doResize = (e: MMouseEvent) => {
            setSize(new Size(700,400))
            e.redraw()
        }
        const resize = IconButton({
            icon:Icons.Resize,
            handleEvent: (e) => {
                if(e.type === 'mouse-down') {
                    doResize(e)
                }
            }
        }).layout(rc, cons)
        resize.settings.pos = size.asPoint().subtract(new Point(50,50))

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
            id: "window",
            pos: new Point(0,0),
            size: size,
            text: "",
            clip: true,
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
