import {
    Button,
    Checkbox,
    drawBlock,
    HBox,
    Icon,
    IconButton,
    Label,
    NumberInput,
    RenderParameters,
    SearchInput,
    Separator,
    TextInput,
    ToggleButton,
    VBox
} from "./test.ts";
import {Icons} from "./icons.ts";

const canvas = document.createElement('canvas')

canvas.width = 700
canvas.height = 300

document.body.appendChild(canvas)

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const c:RenderParameters = {
    ctx:ctx,
    fontSize:'26px',
    debug:true
}
c.ctx.font = '20px sans-serif'


const content = VBox(c, [
    HBox(c,[
        Label(c,'simple components'),
        Button(c,"Button"),
        ToggleButton(c,{text:"Toggle",selected:true}),
        IconButton(c,{text:'Doc',icon:Icons.Document}),
        // IconButton(c,{icon:Icons.Document, ghost:true}),
        Icon(c,{icon:Icons.Document}),
        // Tag(c, {text:'tag'}),
        Checkbox(c,"Checkbox",true),
    ]),
    HBox(c, [
        Label(c,'toolbar'),
        HBox(c, [
            Button(c,"Button"),
            IconButton(c,{text:'IconButton',icon:Icons.Document}),
            IconButton(c,{icon:Icons.Document}),
            Separator(c),
            IconButton(c,{icon:Icons.Document}),
        ]),
    ]),
    HBox(c, [
        Label(c,'inputs'),
        Button(c,"Button"),
        TextInput(c,{placeholder:'text'}),
        NumberInput(c,{placeholder:'0'}),
        SearchInput(c,{placeholder:'search'}),
        Checkbox(c, 'check box', true),
    ])
])

ctx.save()
ctx.translate(100,100);
drawBlock(c,content)
ctx.restore()
