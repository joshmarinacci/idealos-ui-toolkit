import {RenderContext} from "./gfx.ts";
import {Insets, Point, Size} from "josh_js_util";

export type LayoutConstraints = {
    space:Size
    layout:AxisSelfLayout
}

export interface GElement {
    layout(rc: RenderContext, cons:LayoutConstraints): GRenderNode
}

export type ElementSettings = {
    text: string
    padding: Insets
    margin: Insets
    visualStyle:VisualStyle
    borderWidth: Insets
    font: string
    shadow: boolean
}

export type CEvent = {
    type: "mouse-move" | "mouse-down"
    redraw:()=>void
}
export type EventHandler = (event: CEvent) => void

export type VisualStyle = {
    borderColor: string
    textColor:string
    background:string
}
export type RenderNodeSettings = {
    text: string;
    visualStyle:VisualStyle
    contentOffset: Point,
    font: string;
    size: Size;
    pos: Point;
    baseline: number;
    id:string,
    children:GRenderNode[],
    padding: Insets
    margin: Insets
    borderWidth: Insets
    borderRadius?: number
    shadow?:boolean
    handleEvent?:EventHandler,
    clip?:boolean
}
export class GRenderNode {
    settings: RenderNodeSettings;
    constructor(settings: RenderNodeSettings) {
        this.settings = settings
    }
}

export type AxisSelfLayout = "grow" | "shrink"
export type AxisLayout = 'start' | 'center' | 'end'
export const ZERO_INSETS = new Insets(0, 0, 0, 0);
export const ZERO_POINT = new Point(0, 0)
export const TRANSPARENT = 'transparent';
