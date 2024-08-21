import {RenderContext} from "./gfx.ts";
import {Insets, Point, Size} from "josh_js_util";

export type LayoutConstraints = {
    space:Size
    layout:AxisSelfLayout
}

export interface GElement {
    layout(rc: RenderContext, cons:LayoutConstraints): GRenderNode
}

export type VisualStyle = {
    borderColor?: string
    textColor?:string
    background?:string
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

export type MMouseEvent = {
    type: 'mouse-move' | 'mouse-down'
    position:Point
    redraw:()=>void
}
export type MKeyboardEvent = {
    type: 'keyboard-typed'
    key:string,
    redraw:()=>void
}
export type MWheelEvent = {
    type: 'wheel'
    deltaX:number,
    deltaY:number,
    redraw:()=>void
}
export type CEvent = MMouseEvent | MKeyboardEvent | MWheelEvent

export type EventHandler = (event: CEvent) => void

export type RenderNodeSettings = {
    text: string;
    currentStyle?:VisualStyle
    visualStyle:VisualStyle
    hoverStyle?:VisualStyle
    focusedStyle?:VisualStyle
    contentOffset: Point,
    font: string;
    size: Size;
    pos: Point;
    baseline: number;
    id:string,
    inputid?:string,
    children:GRenderNode[],
    padding: Insets
    margin: Insets
    borderWidth: Insets
    borderRadius?: Insets
    shadow?:boolean
    handleEvent?:EventHandler,
    clip?:boolean
    canScroll?:boolean
}
export class GRenderNode {
    settings: RenderNodeSettings;
    constructor(settings: RenderNodeSettings) {
        this.settings = settings
    }
}

export type AxisSelfLayout = "grow" | "shrink"
export type AxisLayout = 'start' | 'center' | 'end' | 'between'
export const ZERO_INSETS = new Insets(0, 0, 0, 0);
export const ZERO_POINT = new Point(0, 0)
export const TRANSPARENT = 'transparent';


export const MGlobals = new Map<string,any>
export const SYMBOL_FONT_ENABLED = 'SYMBOL_FONT_ENABLED';
