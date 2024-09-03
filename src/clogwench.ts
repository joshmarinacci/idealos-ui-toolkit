import {Button} from "./buttons.js";
import pureimage, {Bitmap} from "pureimage"
import process from "node:process"
import {Scene} from "./scene.js";
import {MGlobals, SYMBOL_FONT_ENABLED} from "./base.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {Bounds, Logger, make_logger, Point} from "josh_js_util";
import {Socket} from "node:net";
import {VBox} from "./layout.js";
import {Square} from "./comps2.js";
import * as fs from "node:fs";

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

interface BufferImage {
    width: number;
    height: number;
    data: number[];
    layout: { ARGB: any[] };
    id: string;
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

class ImageWrapper implements BufferImage {
    public width: number;
    height: number;
    data: number[];
    layout: { ARGB: any[]; };
    id: string;
    constructor(img: Bitmap) {
        this.width = img.width
        this.height = img.height
        this.data = Array.from(img.data)
        this.id = "31586440-53ac-4a47-83dd-54c88e857fa5"
        this.layout =  { ARGB: [] };
    }
}

async function doit() {
    let font = pureimage.registerFont(
        "./fonts/SourceSansPro-Regular.ttf",
        "sans-serif"
    )
    await font.load()

    let app = new ClogwenchApp()
    await app.connect()
    console.log("connected")
    await app.send_and_wait({AppConnect: {HelloApp: {}}})
    let bounds = new Bounds(50,50,200,200)
    let win = await app.open_window(bounds)
    // console.log("Opened the window",win)

    const bitmap = pureimage.make(bounds.w, bounds.h)

    const scene = new Scene(start)
    scene.setDPI(1)
    MGlobals.set(Scene.name, scene)
    MGlobals.set(SYMBOL_FONT_ENABLED, true)
    MGlobals.set(STATE_CACHE, new StateCache())
    win.setScene(scene)
    await scene.init()
    scene.setCanvas(bitmap)
    scene.setDPI(1)
    scene.setSize(bounds.size())
    scene.layout()
    scene.redraw()
    console.log("scene laid out and redraw")

    const rect = Bounds.fromPointSize(new Point(0,0),bounds.size())
    // const ctx = bitmap.getContext('2d')
    // ctx.fillStyle = '#ff0000'
    // ctx.fillRect(0,0,bounds.w,bounds.h)
    // ctx.fillStyle = '#000000'
    // console.log("font",ctx.font)
    // ctx.font = '30px sans-serif'
    // ctx.fillText("Hello",20,40)
    await pureimage.encodePNGToStream(bitmap, fs.createWriteStream("out.png"))
    const cmd:DrawImageCommand = {
        app_id: app.id,
        window_id: win.window_id,
        rect,
        buffer: new ImageWrapper(bitmap)
    }
    app.send({
        DrawImageCommand:cmd
    })

    await app.wait_for_close()
}

doit().then(() => console.log("fully started")).catch((e) => console.error(e))
