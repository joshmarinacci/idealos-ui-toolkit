import {
    Button,
    Checkbox,
    drawBlock,
    HBox,
    Icon,
    IconButton,
    Label,
    NumberInput,
    RadioButton,
    RenderParameters,
    SearchInput,
    Separator,
    Tag,
    TextInput,
    ToggleButton,
    VBlock,
    VBox
} from "./test.ts";
import {Icons} from "./icons.ts";
import {Point} from "josh_js_util";

const canvas = document.createElement('canvas')

canvas.width = 800
canvas.height = 300

document.body.appendChild(canvas)

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const c:RenderParameters = {
    ctx:ctx,
    fontSize:'26px',
    debug:false
}
c.ctx.font = '16px sans-serif'


const vconent = VBox(c, [
    HBox(c,[
        Label(c,{text:'buttons'}),
        Button(c,{text:"Button",selected:true}),
        Icon(c,{icon:Icons.Document}),
        IconButton(c,{text:'Doc',icon:Icons.Document}),
        Checkbox(c,"Checkbox",true),
        Tag(c, {text:'tag'}),
    ]),
    HBox(c, [
        Label(c,{text:'toolbar'}),
        HBox(c, [
            Button(c, {text:"Button",selected:false}),
            IconButton(c,{text:'IconButton',icon:Icons.Document}),
            IconButton(c,{icon:Icons.Document}),
            Separator(c),
            IconButton(c,{icon:Icons.Document}),
        ]),
    ]),
    HBox(c, [
        Label(c, {text:'buttons'}),
        Button(c, {text:"Button",selected:true}),
        Checkbox(c, 'check box', true),
        RadioButton(c, 'radio box', false),
        ToggleButton(c, {text:'toggle',selected:true})
    ]),
    HBox(c, [
        Label(c,{text:'inputs'}),
        TextInput(c,{placeholder:'text'}),
        NumberInput(c,{placeholder:'0'}),
        SearchInput(c,{placeholder:'search'}),
    ])
])
async function doit() {
    const font = new FontFace('material-icons',
    'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)')
    document.fonts.add(font)
    await font.load()
    ctx.save()
    drawBlock(c, vconent,{})
    ctx.restore()

}

function findTarget(pos: Point, block: VBlock):VBlock|undefined {
    if(block.bounds.contains(pos)) {
        if(block.children) {
            for (let ch of block.children) {
                if(ch.shadow) continue
                let p2 = pos.subtract(block.bounds.top_left())
                let found = findTarget(p2, ch)
                if(found) return found
            }
        }
        return block
    }
}

canvas.addEventListener('click',(e) => {
    // @ts-ignore
    let rect = e.target.getBoundingClientRect()
    let pos = new Point(e.clientX, e.clientY);
    pos = pos.subtract(new Point(rect.x,rect.y))
    console.log("clicked at",pos)
    let found = findTarget(pos,vconent)
    console.log("found is",found)
    c.ctx.fillStyle = 'white'
    c.ctx.fillRect(0,0,canvas.width,canvas.height)
    drawBlock(c,vconent,{
        highlight:found
    })
})

doit().then(()=>console.log("is done"))
