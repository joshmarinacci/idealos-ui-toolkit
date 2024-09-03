import {Button} from "./buttons.js";
import process from "process"
import {Scene} from "./scene.js";
import {MGlobals, SYMBOL_FONT_ENABLED} from "./base.js";
import {STATE_CACHE, StateCache} from "./state.js";
import {Bounds, Logger, make_logger} from "josh_js_util";
import {Socket} from "net";

const STD_PORT = 3333
function start() {
    const button = Button({
        text:"quit",
        handleEvent:(e) => {
            console.log("event",e)
            process.exit()
        }
    })
    return button

}
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

type DrawRectCommand = {
    app_id:string,
    window_id:string,
    rect: Bounds,
    color:Color
}
type Callback = (any:any) => any
export type Color = {
    r:number,
    g:number,
    b:number,
    a:number
}

class ClogwenchApp {
    client:Socket
    public id: string;
    private windows: Map<any, any>;
    private cb:Callback | undefined
    private log: Logger;
    private received_close: boolean;
    constructor() {
        // this.id = "UNINITIALIZED"
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
                console.log("raw incoming data", str)
                try {
                    let imsg = JSON.parse(str) as IncomingMessage
                    this.log.info("msg",imsg)
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
                    if(msg.OpenWindowResponse) {

                    }
                    // if (msg.MouseDown) return this.windows.get(msg.MouseDown.window_id).dispatch(msg)
                    // if (msg.MouseUp) return this.windows.get(msg.MouseUp.window_id).dispatch(msg)
                    // if (msg.MouseMove) return this.windows.get(msg.MouseMove.window_id).dispatch(msg)
                    // if (msg.KeyDown) return this.windows.get(msg.KeyDown.window_id).dispatch(msg)
                    if (msg.WindowResized) return this.windows.get(msg.WindowResized.window_id).dispatch(msg)
                    if (msg.CloseWindowResponse) {
                        this.log.info("got close window message response",msg.CloseWindowResponse)
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
        this.log.info('sending',JSON.stringify(msg,null,'    '))
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
        console.log("got back open window",response)
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
    constructor(app: ClogwenchApp, info: OpenWindowResponse) {
        this.app = app
        this.window_id = info.window_id
        // this.window_type = info.window_type
        // this.bounds = info.bounds
    }
}
class ClogwenchCanvasContext {
    private canvas: ClogwenchCanvas;
    private log: Logger;
    constructor(param: ClogwenchCanvas) {
        this.canvas = param
        this.log = make_logger('window')
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
        let dr:DrawRectCommand = {
            app_id: this.canvas.window.app.id,
            window_id: this.canvas.window.window_id,
            rect: new Bounds(0,0,20,20),
            color: {
                r:255,
                g:0,
                b:0,
                a:255
            }
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
    fillText() {

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

async function doit() {
    let app = new ClogwenchApp()
    await app.connect()
    console.log("connected")
    await app.send_and_wait({AppConnect: {HelloApp: {}}})
    console.log("got back hello")
    let bounds = new Bounds(50,50,200,200)
    let win = await app.open_window(bounds)
    // console.log("Opened the window",win)

    const scene = new Scene(start)
    scene.setDPI(1)
    MGlobals.set(Scene.name, scene)
    MGlobals.set(SYMBOL_FONT_ENABLED, true)
    MGlobals.set(STATE_CACHE, new StateCache())
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
