import {
    Button, Checkbox,
    drawBlock,
    HBox,
    Icon,
    IconButton,
    Label,
    NumberInput,
    RenderParameters,
    SearchInput,
    Separator,
    TextInput, VBox
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
        // ToggleButton(c,{text:"Toggle",selected:true}),
        IconButton(c,{text:'Doc',icon:Icons.Document}),
        // IconButton(c,{icon:Icons.Document, ghost:true}),
        // Icon(c,{icon:Icons.Document}),
        // Tag(c, {text:'tag'}),
        // Checkbox(c,"Checkbox",true),
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
    ctx.translate(100, 100);
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
