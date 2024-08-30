import {GElement, GRenderNode} from "./base.ts";

export type Frame = {
    name: string
    count: number
}

function tabs(indent: number) {
    let str = ""
    for (let i = 0; i < indent; i++) {
        str += '  '
    }
    return str
}

function dump_keys(button_node: GRenderNode, indent?: number) {
    indent = indent || 1
    if (indent == 1) {
        console.log("KEYS")
    }
    console.log(tabs(indent), button_node.settings.kind,
        button_node.settings.key)
    button_node.settings.children.forEach(child => dump_keys(child, indent + 1))
}

export class KeyVendor {
    private stack: Frame[];

    constructor() {
        this.stack = []
    }

    start() {
        this.stack = [{
            name: 'root',
            count: 0,
        }]
    }

    end() {

    }

    reset() {
        this.stack = []
    }

    getKey() {
        let last = this.stack[this.stack.length - 1]
        last.count += 1
        let key = this.stack.map(n => n.count).join(".")
        // console.log("getting key", last.name, key)
        return key
    }

    // doLayout(button: GElement, rc: RenderContext, cons: LayoutConstraints) {
    //     this.startElement(button)
    //     let res = button.layout(rc, cons)
    //     this.endElement(button)
    //     return res
    // }

    startElement(e: GElement) {
        this.stack.push({
            name: e.constructor.name,
            count: 0,
        })
        // console.log('starting',e.constructor.name, this.stack.map(n => n.count).join("."))
    }

    endElement(_e:GElement) {
        // console.log('ending  ',e.constructor.name, this.stack.map(n => n.count).join("."))
        this.stack.pop()
    }

    dump(node:GRenderNode) {
        dump_keys(node)
    }
}

export const KEY_VENDOR = new KeyVendor()
