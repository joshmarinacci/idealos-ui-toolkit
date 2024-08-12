import {Button, Checkbox, drawBlock, HBox, Label, RenderParameters, VBox} from "./test.ts";

console.log("this is the beginning")

const canvas = document.createElement('canvas')

canvas.width = 500
canvas.height = 300

document.body.appendChild(canvas)

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const c:RenderParameters = {
    ctx:ctx,
    fontSize:'26px',
    debug:false
}
c.ctx.font = '20px sans-serif'
const vblock = HBox(c,[
    Label(c,"label"),
    Button(c,"Button"),
    Checkbox(c,"Checkbox",true),
])

ctx.save()
ctx.translate(100,100);
drawBlock(c,vblock)
ctx.restore()
