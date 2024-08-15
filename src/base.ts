import {RenderContext, withInsets} from "./gfx.ts";
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
    borderWidth: Insets
    borderColor: string
    backgroundColor: string
    font: string
}

export type RenderNodeSettings = {
    text: string;
    textColor: string
    contentOffset: Point,
    background: string,
    font: string;
    size: Size;
    pos: Point;
    baseline: number;
    id:string,
    children:GRenderNode[],
    padding: Insets
    margin: Insets
    borderWidth: Insets
    borderColor: string
}
export class GRenderNode {
    settings: RenderNodeSettings;

    constructor(settings: RenderNodeSettings) {
        this.settings = settings
    }
}

export type AxisSelfLayout = "grow" | "shrink"
export type AxisLayout = 'start' | 'center' | 'end'
export const Style = {
    fontSize: '16px',
    font: '16px sans-serif',

    textColor: 'red',

    panelMargin: withInsets(5),
    panelBorderColor: '#333',
    panelBorderWidth: withInsets(5),
    panelPadding: withInsets(5),
    panelBackgroundColor: '#bbb',
    buttonBackground: "#fff",
    buttonBorderWidth: new Insets(1,1,1,1),
    buttonMargin: withInsets(5),
    buttonPadding: withInsets(5)


}
export const ZERO_INSETS = new Insets(0, 0, 0, 0);
export const ZERO_POINT = new Point(0, 0)
export const TRANSPARENT = 'transparent';
