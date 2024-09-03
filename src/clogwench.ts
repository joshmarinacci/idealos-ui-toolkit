import {Button} from "./buttons.js";
import process from "process"
import {Scene} from "./scene.js";
import {MGlobals, SYMBOL_FONT_ENABLED} from "./base.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {Bounds, Logger, make_logger, Point} from "josh_js_util";
import {Socket} from "net";
import {VBox} from "./layout.js";
import {Square} from "./comps2.js";
import {i} from "vitest/dist/reporters-yx5ZTtEV.js";
import * as buffer from "node:buffer";
import * as buffer from "node:buffer";

const STD_PORT = 3333
type IncomingMessage = {
    source:string,
    command:any,
    trace:boolean,
    timestamp_usec:number,
}
type OpenWindowResponse = {
    app_id:string,
    window_id:string,
    window_type:string,
    window_title:string,
    bounds:Bounds,
}
type MouseDownEvent = {
    app_id:string,
    window_id:string,
    original_timestamp:number,
    button:string,
    x:number,
    y:number,
}
export type Color = {
    r:number,
    g:number,
    b:number,
    a:number
}
const RED:Color = {r: 0, g: 0, b: 255, a: 255}
const MAGENTA:Color = {r:255, g:0, b:255, a:255}
const WHITE:Color = {r:255, g:255, b:255, a:255}
const BLACK:Color = {r:0, g:0, b:0, a:255}
const GREEN = {r:0, g:255, b:0, a:255}
const BLUE = {r:255, g:0, b:0, a:255}
const TRANSPARENT:Color = {r:255, g:0, b:255, a:0}

type DrawRectCommand = {
    app_id:string,
    window_id:string,
    rect: Bounds,
    color:Color
}
type DrawImageCommand = {
    app_id:string,
    window_id:string,
    rect: Bounds,
    buffer: BufferImage,
}
type Callback = (any:any) => any

class ClogwenchApp {
    client:Socket
    // @ts-ignore
    public id: string;
    private windows: Map<any, any>;
    private cb:Callback | undefined
    private log: Logger;
    private received_close: boolean;
    constructor() {
        // this.id = undefined
        this.log = make_logger("APP")
        this.client = new Socket()
        this.windows = new Map()
        this.received_close = false
    }

    async connect() {
        return new Promise<void>((res, rej) => {
            this.client.connect(STD_PORT, '127.0.0.1', (): void => {
                this.log.info('connected event')
                res()
            })
            this.client.on('data', (data:any) => {
                let str = data.toString()
                // console.log("raw incoming data", str)
                try {
                    let imsg = JSON.parse(str) as IncomingMessage
                    // this.log.info("msg",imsg)
                    if(imsg.trace) {
                        this.log.info("tracing incoming message",imsg);
                        // log.info("current is",Date.now());
                        let diff = Date.now()*1000 - imsg.timestamp_usec
                        this.log.info(`diff is ${diff} msec`)
                    }
                    let msg = imsg.command

                    if (msg.AppConnectResponse) {
                        this.id = msg.AppConnectResponse.app_id
                        if (this.cb) this.cb(msg)
                        return
                    }
                    if (msg.MouseDown) return this.windows.get(msg.MouseDown.window_id).dispatch(msg)
                    if (msg.MouseUp) return this.windows.get(msg.MouseUp.window_id).dispatch(msg)
                    if (msg.MouseMove) return this.windows.get(msg.MouseMove.window_id).dispatch(msg)
                    if (msg.KeyDown) return this.windows.get(msg.KeyDown.window_id).dispatch(msg)
                    if (msg.WindowResized) return this.windows.get(msg.WindowResized.window_id).dispatch(msg)
                    if (msg.CloseWindowResponse) {
                        this.log.info("got close window message response",msg.CloseWindowResponse)
                        process.exit(0)
                        this.received_close = true
                        // if (this._on_close_window_cb) this._on_close_window_cb({})
                        return
                    }
                    this.log.warn("msg is", msg)
                    if (this.cb) this.cb(msg)
                } catch (e) {
                    this.log.error("error JSON parsing",e)
                }
            })
        })
    }

    async send_and_wait(obj:any):Promise<IncomingMessage> {
        let prom = new Promise<IncomingMessage>((res,rej) => {
            this.cb = (msg:IncomingMessage) => {
                this.cb = undefined
                res(msg)
            }
        })
        this.send(obj)
        return prom
    }

    send(obj: any) {
        let src = this.id
        if(!src) src = "00000000-0000-0000-0000-000000000000";
        let msg = {
            source:src,
            trace:false,
            timestamp_usec:0,
            command:obj,
        }
        let str = JSON.stringify(msg)
        if(msg.trace) this.log.info('sending',str)
        // this.log.info('sending',JSON.stringify(msg,null,'    '))
        this.client.write(str)
    }
    async open_window(rect:Bounds):Promise<CWindow> {
        let response = await this.send_and_wait({
            OpenWindowCommand: {
                window_type: "plain",
                window_title: "some-window",
                bounds: rect,
            }
        })
        // console.log("got back open window",response)
        let win = new CWindow(this, (response.OpenWindowResponse as OpenWindowResponse))
        this.windows.set(win.window_id, win)
        return win
    }

    async wait_for_close():Promise<void> {
        this.received_close = false
        return new Promise((res,rej) => {
            let handle = setInterval(()=>{
                console.log("checking for end")
                if(this.received_close) {
                    clearInterval(handle)
                    res()
                }
            },1000)
        })
    }
}
class CWindow {
    app: ClogwenchApp;
    window_id: string;
    // private window_type: string;
    // private bounds: Bounds;
    private log: Logger;
    private scene: Scene;
    constructor(app: ClogwenchApp, info: OpenWindowResponse) {
        this.app = app
        this.window_id = info.window_id
        // this.window_type = info.window_type
        // this.bounds = info.bounds
        this.log = make_logger('window')
    }
    dispatch(e) {
        this.log.info(e)
        if(e.MouseDown) {
            let evt = e.MouseDown as MouseDownEvent
            console.log("clicked at",evt)
            this.scene.handleMouseDown(new Point(evt.x,evt.y),false)
        }
    }

    setScene(scene: Scene) {
        this.scene = scene
    }
}

class BufferImage {
    width: number;
    height: number;
    data: number[];
    layout: { ARGB: any[] };
    id: string;


    constructor(w:number, h:number) {
        this.width = w
        this.height = h
        this.data = []
        for(let i=0; i<this.width*this.height; i++) {
            this.data[i*4+0] = 255
            this.data[i*4+1] = 255
            this.data[i*4+2] = 0
            this.data[i*4+3] = 255
        }
        this.layout = {ARGB:[]}
        // this.id = "some long string"
        this.id = "31586440-53ac-4a47-83dd-54c88e857fa5"
    }
    set_pixel(x:number, y:number, color:Color) {
        if(x < 0) return
        if(y < 0) return
        if(x >= this.width) return
        if(y >= this.height) return
        let n = (y*this.width+x)
        this.data[n*4 + 0] = color.a
        this.data[n*4 + 1] = color.r
        this.data[n*4 + 2] = color.g
        this.data[n*4 + 3] = color.b
    }
    get_pixel(x:number,y:number):Color {
        if(x<0) return MAGENTA
        if(y<0) return MAGENTA
        if(x >= this.width) return MAGENTA
        if(y >= this.height) return MAGENTA
        let n = (y*this.width+x)
        let color:Color = {
            a: this.data[n*4+0],
            r: this.data[n*4+1],
            g: this.data[n*4+2],
            b: this.data[n*4+3],
        }
        return color
    }
    draw_rect(rect: Bounds, color:Color):void {
        for(let i = rect.x; i<rect.right(); i++) {
            for(let j=rect.y; j<rect.bottom(); j++) {
                // console.log("setting",i,j)
                this.set_pixel(i,j,color)
            }
        }
    }
    draw_image(dst_rect: Bounds, img: BufferImage) {
        // console.log("buffer drawing image",dst_rect,img)
        this.draw_rect(dst_rect,MAGENTA);
        for(let i = dst_rect.x; i<dst_rect.right(); i++) {
            for(let j=dst_rect.y; j<dst_rect.bottom(); j++) {
                let sx = i-dst_rect.x
                let sy = j-dst_rect.y
                let c = img.get_pixel(sx,sy);
                // console.log("setting",i,j,'from',sx,sy,'color',c)
                this.set_pixel(i,j,c)
            }
        }
    }
}

const CSS_TO_ARGB:Record<string,Color> = {
    transparent:TRANSPARENT,
    black:BLACK,
    red:RED,
    '#fff':WHITE,
    '#f0f0f0':{r:240,g:240,b:240,a:255},
}
function toARGB(value: any) {
    if(typeof value === 'string') {
        let str = value
        if(CSS_TO_ARGB[str]) return CSS_TO_ARGB[str]
    }
    return RED
}

class ClogwenchCanvasContext {
    get fillStyle(): Color {
        return this._fill;
    }

    set fillStyle(value: Color) {
        this._fill = toARGB(value);
    }
    private canvas: ClogwenchCanvas;
    private log: Logger;
    private _fill:Color
    constructor(param: ClogwenchCanvas) {
        this.canvas = param
        this.log = make_logger('window')
        this._fill = MAGENTA
    }
    measureText(str:string) {
        this.log.info("mesuring text",str)
        return {
            width: str.length*10,
            emHeightAscent: 10,
            emHeightDescent: 0,
        }
    }
    fillRect(x:number,y:number,w:number,h:number) {
        this.log.info("filling rectangle",x,y,w,h)
        if(isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
            this.log.warn("rect has invalid values",x,y,w,h)
            return
        }
        let dr:DrawRectCommand = {
            app_id: this.canvas.window.app.id,
            window_id: this.canvas.window.window_id,
            rect: new Bounds(x,y,w,h),
            color: this._fill,
        }
        this.canvas.window.app.send({
            DrawRectCommand:dr,
        })

    }
    translate() {

    }
    beginPath() {

    }
    roundRect() {

    }
    fill() {
    }
    stroke() {

    }
    fillText(text:string, x:number, y:number) {
        this.log.info("filling text",text,x,y)
        const buffer = new BufferImage(text.length*10,10)
        for(let i=0; i<text.length; i++) {
            buffer.draw_rect(new Bounds(i*10, 3, 8, 7), this._fill)
        }
        const rect = new Bounds(Math.floor(x),Math.floor(y-10),text.length*10,10)
        const cmd:DrawImageCommand = {
            app_id: this.canvas.window.app.id,
            window_id: this.canvas.window.window_id,
            rect,
            buffer
        }
        this.canvas.window.app.send({
            DrawImageCommand:cmd
        })
    }
    strokeRect() {
    }
    scale() {

    }
    save() {

    }
    restore(){

    }


}
class ClogwenchCanvas {
    window: CWindow;
    constructor(window:CWindow) {
        this.window = window
    }
    getContext() {
        return new ClogwenchCanvasContext(this)
    }
}

function start() {
    const button = Button({
        text:"quit",
        handleEvent:(e) => {
            console.log("app got the event",e)
            process.exit()
        }
    })
    return VBox({
        children:[
            button,
            Square(20,"red")
        ]
    })

}

async function doit() {
    let app = new ClogwenchApp()
    await app.connect()
    console.log("connected")
    await app.send_and_wait({AppConnect: {HelloApp: {}}})
    let bounds = new Bounds(50,50,200,200)
    let win = await app.open_window(bounds)
    // console.log("Opened the window",win)

    const scene = new Scene(start)
    scene.setDPI(1)
    MGlobals.set(Scene.name, scene)
    MGlobals.set(SYMBOL_FONT_ENABLED, true)
    MGlobals.set(STATE_CACHE, new StateCache())
    win.setScene(scene)
    await scene.init()
    scene.setCanvas(new ClogwenchCanvas(win))
    scene.setDPI(1)
    scene.setSize(bounds.size())
    scene.layout()
    scene.redraw()
    console.log("scene laid out and redraw")
    await app.wait_for_close()
}

doit().then(() => console.log("fully started")).catch((e) => console.error(e))
