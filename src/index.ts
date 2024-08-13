import {
    Button, Checkbox,
    drawBlock,
    HBox,
    Icon,
    IconButton,
    Label,
    NumberInput, RadioButton,
    RenderParameters,
    SearchInput,
    Separator, ShrinkBox,
    TextInput, ToggleButton, VBox
} from "./test.ts";
import {Icons} from "./icons.ts";

const canvas = document.createElement('canvas')

canvas.width = 800
canvas.height = 300

document.body.appendChild(canvas)

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const c:RenderParameters = {
    ctx:ctx,
    fontSize:'26px',
    debug:true
}
c.ctx.font = '20px sans-serif'


function Tag(c: RenderParameters, param2: { text: string }) {
    return ShrinkBox(c,[Label(c,param2.text)],{
        background:"aqua"
    })
}

const content = VBox(c, [
    HBox(c,[
        Label(c,'buttons'),
        Button(c,{text:"Button",selected:true}),
        IconButton(c,{text:'Doc',icon:Icons.Document}),
        Icon(c,{icon:Icons.Document}),
        Checkbox(c,"Checkbox",true),
        Tag(c, {text:'tag'}),
    ]),
    HBox(c, [
        Label(c,'toolbar'),
        HBox(c, [
            Button(c, {text:"Button",selected:false}),
            IconButton(c,{text:'IconButton',icon:Icons.Document}),
            IconButton(c,{icon:Icons.Document}),
            Separator(c),
            IconButton(c,{icon:Icons.Document}),
        ]),
    ]),
    HBox(c, [
        Button(c, {text:"Button",selected:true}),
        Checkbox(c, 'check box', true),
        RadioButton(c, 'radio box', false),
        ToggleButton(c, {text:'enabled',selected:true})
    ]),
    HBox(c, [
        Label(c,'inputs'),
        TextInput(c,{placeholder:'text'}),
        NumberInput(c,{placeholder:'0'}),
        SearchInput(c,{placeholder:'search'}),
    ])
])
// const content = IconButton(c,{ icon: Icons.Document, text:"Download"})

// const content = Icon(c, {icon:Icons.Document, color:'red'})
async function doit() {
    const font = new FontFace('material-icons',
    'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)')
    // 'url(https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200)')
    document.fonts.add(font)
    await font.load()
    console.log("font is loaded")
    ctx.save()
    // ctx.translate(100, 100);
    // console.log("sleeping")
    // await sleep(3)
    console.log('drawing')
    drawBlock(c, content)
    ctx.restore()

    // ctx.fillStyle = 'green';
    // ctx.font = '20px material-icons';
    // ctx.fillText('airplanemode_active', 20, 40);

}

doit().then(()=>console.log("is done"))
