import {
    Button,
    Checkbox, DebugBorder,
    drawBlock,
    HBox,
    Icon,
    IconButton,
    Label,
    ListView,
    RadioButton,
    RenderParameters,
    ToggleButton,
    VBlock,
    VBox
} from "./components.ts";
import {Point, Size} from "josh_js_util";
import {Icons} from "./icons.ts";

const canvas = document.createElement('canvas')

canvas.width = 600
canvas.height = 300

document.body.appendChild(canvas)

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const c:RenderParameters = {
    ctx: ctx,
    fontSize: '16px',
    debug: {
        outline: false,
        baseline: false,
    },
    redraw: function (): void {
        throw new Error("Function not implemented.");
    }
}
c.ctx.font = '16px sans-serif'

let data:string[] = [
    "alice",
    "bob",
    "claire",
    // "dan",
    // "eve"
]
let state = {
    checked:true,
    toggled:true,
    listSelected: "alice"
}

function makeTree(c:RenderParameters) {
    // return VBox(c, [
    //     Button(c,{text:'A', flex:0}),
    //     Button(c,{text:'B', flex:0}),
    //     Button(c,{text:'C'})
    // ],{
    //     border:DebugBorder,
    //     selfLayout:'grow',
    //     preferredSize: new Size(200,200),
    //     mainAxisAlign:'middle',
    //     crossAxisAlign: 'end',
    // })
    // return HBox(c,[
    //     Button(c,{text:'A', flex:0}),
    //     Button(c,{text:'B', flex:0}),
    //     Button(c,{text:'C'})
    // ],{
    //     // border:DebugBorder,
    //     selfLayout:'shrink',
    //     mainAxisAlign:"middle",
    //     preferredSize: new Size(300,100),
    //     crossAxisAlign:"middle",
    // })


    return VBox(c,[
        Button(c,{text:"hello"}),
        HBox(c,[
            Button(c,{text:"Hello"}),
            Button(c,{text:"There"}),
        ],{
            border:DebugBorder,
            flex:1.0,
            selfLayout:'shrink',
            crossAxisAlign:'middle',
        }),
        Button(c,{text:"mister"}),
    ],{
        border:DebugBorder,
        selfLayout:'grow',
        preferredSize: new Size(400,200),
        crossAxisAlign:'middle',
        mainAxisAlign:'start',
    })

    // return VBox(c, [
        // HBox(c, [
        //     Label(c, {text: 'buttons'}),
        //     Button(c, {text: "Button", selected: true}),
        //     Icon(c, {icon: Icons.Document}),
        //     IconButton(c, {text: 'Doc', icon: Icons.Document}),
        //     Checkbox(c, {
        //         text: "Checkbox", selected: state.checked, handleEvent: () => {
        //             state.checked = !state.checked
        //             c.redraw()
        //         }
        //     }),
        //     RadioButton(c, 'radio box', false),
        //     ToggleButton(c, {text: 'toggle', selected: state.toggled, handleEvent: () => {
        //             state.toggled = !state.toggled
        //             c.redraw()
        //         }})
        //     // Tag(c, {text:'tag'}),
        // ]),
        // HBox(c, [
        //     Label(c,{text:'toolbar'}),
        //     HBox(c, [
        //         Button(c, {text:"Button",selected:false}),
        //         IconButton(c,{text:'IconButton',icon:Icons.Document}),
        //         IconButton(c,{icon:Icons.Document}),
        //         Separator(c),
        //         IconButton(c,{icon:Icons.Document}),
        //     ]),
        // ]),
        // HBox(c, [
        //     Label(c, {text:'buttons'}),
        //     Button(c, {text:"Button",selected:true}),
        //     Checkbox(c, {text:'check box', selected:true}),
        // ]),
        // HBox(c, [
        //     Label(c,{text:'inputs'}),
        //     TextInput(c,{placeholder:'text'}),
        //     NumberInput(c,{placeholder:'0'}),
        //     SearchInput(c,{placeholder:'search'}),
        // ])

        // ListView(c, {
        //     data: data,
        //     selected: state.listSelected,
        //     onSelected: (item) => {
        //         state.listSelected = item
        //         c.redraw()
        //     }
        // })
    // ])
}
let vconent = makeTree(c)
function redraw() {
    ctx.save()
    drawBlock(c, vconent,{})
    ctx.restore()
}
c.redraw = () => {
    vconent = makeTree(c)
    redraw()
}

async function doit() {
    const font = new FontFace('material-icons',
    'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)')
    document.fonts.add(font)
    await font.load()
    redraw()
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
    // console.log("clicked at",pos)
    let found = findTarget(pos,vconent)
    // console.log("found is",found)
    if(found) {
        // console.log(found.name)
        // console.log('bounds',found.bounds)
        // console.log('margin',found.margin)
        // console.log('padding',found.padding)
        // console.log("found event",found.handleEvent)
        if(found.handleEvent) found.handleEvent({type:"click"})
    }
    c.ctx.fillStyle = 'white'
    c.ctx.fillRect(0,0,canvas.width,canvas.height)
    drawBlock(c,vconent,{
        highlight:found
    })
})

doit().then(()=>console.log("is done"))
