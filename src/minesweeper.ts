import {Point, Size} from 'josh_js_util'
import { AGrid2D, Schema } from 'rtds-core'
import {GElement, GRenderNode, LayoutConstraints, ZERO_INSETS, ZERO_POINT} from "./base.js";
import {RenderContext} from './gfx.js';
import {KEY_VENDOR} from "./keys.js";
import {Button} from "./buttons.js";
import {useRefresh} from "./util.js";

const S = new Schema()
const Cell = S.map({
    bomb: S.boolean(),
    revealed: S.boolean(),
    flag: S.boolean(),
})

type CellType = typeof Cell

const MinecraftGrid = new AGrid2D(Cell, {
    width: 5, height: 5
})
type GridType = typeof MinecraftGrid

function setupLevel(grid: typeof MinecraftGrid) {
    grid.fill((_n: Point) => {
        const cell = Cell.clone()
        cell.get('bomb').set(Math.random() > 0.9)
        cell.get('revealed').set(false)
        cell.get('flag').set(false)
        return cell
    })
}

const ADJACENT_POINTS = [
    new Point(-1, -1),
    new Point(0, -1),
    new Point(1, -1),
    new Point(-1, 0),
    new Point(1, 0),
    new Point(-1, 1),
    new Point(0, 1),
    new Point(1, 1),
]

function calcAdjacent(grid: GridType, index: Point) {
    let total = 0
    ADJACENT_POINTS.forEach((pt) => {
        let nd = index.add(pt)
        if (grid.isValidIndex(nd) && grid.get(nd).get('bomb').get()) total += 1
    })
    return total
}

function reveal(grid: GridType, pt: Point) {
    if (!grid.isValidIndex(pt)) return
    let cell = grid.get(pt)
    if (cell.get('revealed').get()) return
    cell.get('revealed').set(true)
    let adj = calcAdjacent(grid, pt)
    if (adj == 0) ADJACENT_POINTS.forEach((adj) => reveal(grid, pt.add(adj)))
}

function makeCellView(
    grid: GridType,
    cell: CellType,
    index: Point,
    _size: number
) {
    let text = "?"
    if(cell.get('revealed').get() && !cell.get('bomb').get()) {
        text = `${calcAdjacent(grid,index)}`
    }
    let bg = '#ccc'
    if(cell.get('flag').get()) bg = 'blue'
    if(cell.get('revealed').get()) {
        if(cell.get('bomb').get()) {
            bg = 'red'
            text = "X"
        } else {
            bg = 'white'
        }
    }
    return Button({
        text:text,
        visualStyle: {
            background: bg,
            borderColor: "blue",
            textColor: "blue",
        },
        handleEvent:(e) => {
            if(e.type === 'mouse-down') {
                if(e.button === 'Primary') {
                    reveal(grid, index)
                }
                if(e.button === 'Secondary') {
                    cell.get('flag').set(!cell.get('flag').get())
                }
                e.use()
            }
        }
    })
}


const grid = MinecraftGrid.clone()
setupLevel(grid)

type Grid2DViewOptions<T> = {
    scale: number
    data: AGrid2D<T>
    drawLines: boolean;
    renderCell: (grid: AGrid2D<T>, cell: T, index: Point, scale: number) => GElement;
}

class Grid2DViewElement<T> implements GElement {
    private opts: Grid2DViewOptions<T>;

    constructor(opts: Grid2DViewOptions<T>) {
        this.opts = opts
    }

    layout(rc: RenderContext, _cons: LayoutConstraints): GRenderNode {
        const key = KEY_VENDOR.getKey()
        useRefresh(key,this.opts.data)
        let children:GRenderNode[] = []
        this.opts.data.forEach((v,n)=>{
            const view = this.opts.renderCell(this.opts.data,v,n,this.opts.scale)
            let node = view.layout(rc,{
                space: new Size(this.opts.scale,this.opts.scale),
                layout: "grow"
            })
            node.settings.pos = n.scale(this.opts.scale)
            children.push(node)
        })
        return new GRenderNode({
            key: key,
            kind: "grid-cell",
            baseline: 0,
            children: children,
            contentOffset: ZERO_POINT,
            font: "",
            pos: new Point(0,0),
            size: new Size(this.opts.scale*this.opts.data.width,this.opts.scale*this.opts.data.height),
            padding: ZERO_INSETS,
            visualStyle: {
                borderColor:"red",
                background:"white",
                textColor:"black"
            }
        })
    }
}

function Grid2DView<T>(opts: Grid2DViewOptions<T>) {
    return new Grid2DViewElement(opts)
}

export function MinesweeperApp() {
    return Grid2DView({
        data:grid,
        drawLines:true,
        renderCell:makeCellView,
        scale: 40,
    })
}
