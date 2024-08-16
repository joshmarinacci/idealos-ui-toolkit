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
    textColor: string
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
    borderRadius?: number
}
export class GRenderNode {
    settings: RenderNodeSettings;

    constructor(settings: RenderNodeSettings) {
        this.settings = settings
    }
}

export type AxisSelfLayout = "grow" | "shrink"
export type AxisLayout = 'start' | 'center' | 'end'
// light style
// export const Style = {
//     fontSize: '16px',
//     font: '16px sans-serif',
//
//     textColor: '#fff',
//     borderRadius: 0,
//
//     panelMargin: withInsets(0),
//     panelBorderColor: '#333',
//     panelBorderWidth: withInsets(0),
//     panelPadding: withInsets(0),
//     panelBackgroundColor: '#222',
//     panelBorderRadius: 4,
//
//     buttonBackground: "#333",
//     buttonTextColor: '#fff',
//
//     buttonMargin: withInsets(4),
//     buttonBorderColor: '#666',
//     buttonBorderWidth: withInsets(1),
//     buttonPadding: withInsets(7),
//     buttonBorderRadius: 4,
//
//     tagBorderRadius: 16
//
//
// }
// dark style
export const Style = {
    fontSize: '16px',
    font: '16px sans-serif',

    textColor: 'black',
    borderRadius: 0,

    panelMargin: withInsets(0),
    panelBorderColor: 'black',
    panelBorderWidth: withInsets(0),
    panelPadding: withInsets(0),
    panelBackgroundColor: 'white',
    panelBorderRadius: 4,

    buttonBackground: "white",
    buttonTextColor: 'black',

    buttonMargin: withInsets(4),
    buttonBorderColor: 'black',
    buttonBorderWidth: withInsets(1),
    buttonPadding: withInsets(7),
    buttonBorderRadius: 4,

    tagBorderRadius: 16


}
export const ZERO_INSETS = new Insets(0, 0, 0, 0);
export const ZERO_POINT = new Point(0, 0)
export const TRANSPARENT = 'transparent';
