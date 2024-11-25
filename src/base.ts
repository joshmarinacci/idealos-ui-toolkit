import {Insets, Point, Size} from "josh_js_util";
import {RenderContext} from "./gfx.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {LogicalKeyboardCode} from "./keyboard.js";

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

export type FontSettings = {
    font: string
    fontWeight: string
    fontSize: number
}
export type ElementSettings = {
    key?:string
    kind?:string
    padding?: Insets
    visualStyle?:VisualStyle
    hoverStyle?: VisualStyle
    focusedStyle?: VisualStyle
    borderWidth?: Insets
    borderRadius?: Insets | number,
    fontSettings?: FontSettings
    handleEvent?:EventHandler,
    shadow?: boolean
}

type BaseEvent = {
    redraw:()=>void
    use:()=>void
}
export type MouseButton = "None" | "Primary" | "Secondary"
export type MMouseEvent = {
    type: 'mouse-move' | 'mouse-down' | 'mouse-up'
    position:Point
    button: MouseButton
    delta:Point,
    redraw:()=>void
    shift: boolean
} & BaseEvent
export type MKeyboardEvent = {
    type: 'keyboard-typed'
    key:LogicalKeyboardCode
    control:boolean
    shift:boolean
    meta: boolean
    alt: boolean
    redraw:()=>void
} & BaseEvent
export type MWheelEvent = {
    type: 'wheel'
    deltaX:number,
    deltaY:number,
} & BaseEvent
export type CEvent = MMouseEvent | MKeyboardEvent | MWheelEvent

export type EventHandler = (event: CEvent) => void

export type RenderCallback = (ctx:RenderContext) => void

export type RenderNodeSettings = {
    kind:string,
    key:string,
    text?: string;
    visualStyle:VisualStyle
    hoverStyle?:VisualStyle
    focusedStyle?:VisualStyle
    contentOffset: Point,
    font: string;
    fontSize?: number,
    fontWeight?:string
    size: Size;
    pos: Point;
    baseline: number;
    inputid?:string,
    children:GRenderNode[],
    padding?: Insets
    borderWidth?: Insets
    borderRadius?: Insets | number
    shadow?:boolean
    handleEvent?:EventHandler,
    clip?:boolean
    canScroll?:boolean
    popup?:boolean
    renderCallback?: RenderCallback
}
export class GRenderNode {
    settings: RenderNodeSettings
    userdata: Record<string, any>
    debug: boolean;
    hover: boolean;
    focused: boolean;
    constructor(settings: RenderNodeSettings, userdata?:Record<string,any>) {
        this.settings = settings
        this.userdata = userdata || {}
        this.debug = false
        this.hover = false
        this.focused = false
        if(isNaN(settings.baseline)) {
            console.log("Rendernode created without baseline")
            throw new Error("missing baseline")
        }
    }
}

export type AxisSelfLayout = "grow" | "shrink"
export type AxisLayout = 'start' | 'center' | 'end' | 'between'
export const ZERO_INSETS = new Insets(0, 0, 0, 0);
export const ZERO_POINT = new Point(0, 0)

export const TRANSPARENT = 'transparent';


export const MGlobals = new Map<string,any>
export const SYMBOL_FONT_ENABLED = 'SYMBOL_FONT_ENABLED';
export type StateHandler<T> = {
    get: () => T
    set: (value: T) => void
}

export function useState<T>(key: string, prop: string, hand: StateHandler<T> | undefined, fallback: () => T): [T, (value: T) => void] {
    if (hand) return [
        hand.get(),
        hand.set
    ];
    const cache: StateCache = MGlobals.get(STATE_CACHE)
    const state = cache.getState(key)
    return state.useState(prop, fallback)
}
