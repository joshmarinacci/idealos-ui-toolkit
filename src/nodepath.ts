import {GRenderNode, MMouseEvent, MWheelEvent} from "./base.js";
import {Bounds, Point} from "josh_js_util";

export class NodePath {
    nodes: GRenderNode[];

    constructor(node: GRenderNode) {
        this.nodes = [node]
    }

    appendParent(root_node: GRenderNode) {
        this.nodes.push(root_node);
    }

    target(): GRenderNode {
        return this.nodes[0]
    }

    count() {
        return this.nodes.length
    }

    toTargetPoint(point: Point) {
        for (let node of this.nodes) {
            point = point.subtract(node.settings.pos)
        }
        return point
    }

    dispatch(evt: MMouseEvent | MWheelEvent): void {
        let he = this.target().settings.handleEvent
        console.log("sending to",this.target().settings.kind,this.target().settings.key)
        if(evt.type === 'mouse-move' || evt.type === 'mouse-down' || evt.type === 'mouse-up') {
            evt.position = this.toTargetPoint(evt.position)
        }
        if(he) he(evt)
    }
}

export function findPathToNodeAtPoint(cursor: Point, node: GRenderNode): NodePath | undefined {
    let bds = Bounds.fromPointSize(node.settings.pos, node.settings.size)
    // console.log("looking at", bds.toString(), cursor.toString())
    if (node.settings.shadow) return undefined
    if (bds.contains(cursor)) {
        // console.log("inside", root_node.settings.kind, root_node.settings.shadow)
        for (let i = node.settings.children.length - 1; i >= 0; i--) {
            let ch = node.settings.children[i]
            let point2 = cursor.subtract(node.settings.pos)
            let path = findPathToNodeAtPoint(point2, ch)
            if (path) {
                path.appendParent(node)
                return path
            }
        }
        return new NodePath(node)
    } else {
        return undefined
    }
}

export function findPathToNodeByKey(key: string | undefined, root_node: GRenderNode): NodePath | undefined {
    if(!key) return undefined
    if (root_node.settings.key === key) {
        return new NodePath(root_node)
    }
    for (let ch of root_node.settings.children) {
        let path = findPathToNodeByKey(key, ch)
        if (path) {
            path.appendParent(root_node)
            return path
        }
    }
    return undefined
}

export function findPathToScrollTargetAtPoint(cursor: Point, node: GRenderNode): NodePath | undefined {
    let bds = Bounds.fromPointSize(node.settings.pos, node.settings.size)
    if (bds.contains(cursor)) {
        if (node.settings.children) {
            // go backwards
            for (let i = node.settings.children.length - 1; i >= 0; i--) {
                let ch = node.settings.children[i]
                // console.log("ch under mouse is",ch)
                if (ch.settings.shadow) continue
                let p2 = cursor.subtract(bds.top_left())
                let found = findPathToScrollTargetAtPoint(p2,ch)
                if (found) {
                    found.appendParent(node)
                    return found
                }
            }
        }
        if (node.settings.canScroll === true) {
            return new NodePath(node)
        }

    }
}
