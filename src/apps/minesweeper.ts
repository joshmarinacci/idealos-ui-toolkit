import {Point} from 'josh_js_util'
import {AGrid2D, ObjAtom, Schema} from 'rtds-core'
import {Button} from "../buttons.js";
import {Grid2DView} from "../grid2d.js";
import {VBox} from "../layout.js";
import {Label} from "../text.js";
import {KEY_VENDOR} from "../keys.js";
import {useRefresh} from "../util.js";

const S = new Schema()
const Cell = S.map({
    bomb: S.boolean(),
    revealed: S.boolean(),
    flag: S.boolean(),
})

type CellType = typeof Cell

const MinesweeperGrid = new AGrid2D(Cell, {
    width: 15, height: 15
})
type MSGridType = typeof MinesweeperGrid

function setupLevel(grid: typeof MinesweeperGrid) {
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

function calcAdjacent(grid: MSGridType, index: Point) {
    let total = 0
    ADJACENT_POINTS.forEach((pt) => {
        let nd = index.add(pt)
        if (grid.isValidIndex(nd) && grid.get(nd).get('bomb').get()) total += 1
    })
    return total
}

function reveal(grid: MSGridType, pt: Point) {
    if (!grid.isValidIndex(pt)) return
    let cell = grid.get(pt)
    if (cell.get('revealed').get()) return
    cell.get('revealed').set(true)
    let adj = calcAdjacent(grid, pt)
    if (adj == 0) ADJACENT_POINTS.forEach((adj) => reveal(grid, pt.add(adj)))
}


const GameState = S.map({
// @ts-ignore
    mode:S.enum(['won','lost','playing'],"playing"),
    grid:MinesweeperGrid,
})

const state = GameState.cloneWith({
    mode:"playing",
})

// all cells with bomb should be flagged
// all cells w/o bomb should be revealed
// or else not revealed with flag and is bomb
function didWin(grid: MSGridType):boolean {
    let invalid = 0
    grid.forEach((cell)=> {
        let bomb = cell.get('bomb').get()
        let rev = cell.get('revealed').get()
        let flag = cell.get('flag').get()
        if(bomb) {
            if(!flag) {
                invalid += 1
            }
        } else {
            if(!rev) {
                invalid += 1
            }
        }
    })
    return invalid === 0
}
function didLose(grid: MSGridType):boolean {
    let sploded = 0
    grid.forEach((cell)=> {
        if(cell.get('revealed').get() && cell.get('bomb').get()) sploded += 1
    })
    return sploded > 0
}


setupLevel(state.get('grid'))

function makeCellView( grid: MSGridType, cell: CellType, index: Point, _size: number) {
    const key = KEY_VENDOR.getKey()
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
        key:key,
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
                if(didWin(grid)) {
                    console.log("you won")
                    state.get('mode').set("won")
                }
                if(didLose(grid)) {
                    console.log("you lost")
                    state.get('mode').set("lost")
                }
                e.use()
                e.redraw()
            }
        }
    })
}

function ReactiveLabel(opts:{ text:ObjAtom<string>}) {
    const key = KEY_VENDOR.getKey()
    // useRefresh(key,opts.text)
    return Label({
        key:key,
        text:opts.text.get().toString()
    })
}
export function MinesweeperApp() {
    const key = KEY_VENDOR.getKey()
    useRefresh(key,state)
    return VBox({
        children:[
            ReactiveLabel({text:state.get('mode')}),
            Button({text:"restart", handleEvent:(e) => {
                if(e.type === 'mouse-down') {
                    setupLevel(state.get('grid'))
                    state.get('mode').set("playing")
                    e.use()
                    e.redraw()
                }
                }}),
            Grid2DView({
                data:state.get('grid'),
                drawLines:true,
                renderCell:makeCellView,
                scale: 30,
            })
        ]
    })
}
