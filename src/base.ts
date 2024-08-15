import {RenderContext} from "./gfx.ts";
import {Insets, Point, Size} from "josh_js_util";

export interface GElement {
    layout(rc: RenderContext, space: Size): GRenderNode
}

export type ElementSettings = {
    text: string
    padding: Insets
    margin: Insets
    borderWidth: Insets
    borderColor: string
    font: string
}

export type RenderNodeSettings = {
    text: string;
    background: string | undefined,
    font: string;
    size: Size;
    pos: Point;
    baseline: number;
    id:string,
    children:GRenderNode[],
    padding: Insets
}
export class GRenderNode {
    settings: RenderNodeSettings;

    constructor(settings: RenderNodeSettings) {
        this.settings = settings
    }
}

export type AxisSelfLayout = "grow" | "shrink"
export type AxisLayout = 'start' | 'center' | 'end'