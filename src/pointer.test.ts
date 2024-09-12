import {describe, expect, it} from "vitest";
import {makeHeadlessRc} from "./key.test.js";
import {KEY_VENDOR} from "./keys.js";
import {HBox} from "./layout.js";
import {Square} from "./comps2.js";
import {LayoutConstraints, ZERO_INSETS} from "./base.js";
import {Point} from "josh_js_util";
import {findPathToNodeAtPoint, findPathToNodeByKey, NodePath} from "./nodepath.js";


describe("mouse events", () => {
    it('can find nodes in the tree by position and key', async () => {
        const rc = makeHeadlessRc()
        KEY_VENDOR.reset()
        KEY_VENDOR.start()
        const cons: LayoutConstraints = {space: rc.size, layout: 'grow'};
        const root = HBox({
            mainAxisSelfLayout: 'shrink',
            borderWidth: ZERO_INSETS,
            children: [
                Square(20, 'red'),
                Square(20, 'blue'),
            ]
        })
        const root_node = root.layout(rc, cons)
        KEY_VENDOR.end()

        // console.log("root node",root_node)

        // create mouse cursor point
        const cursor = new Point(10, 10)
        // find node under the mouse cursor
        const maybe_path_1 = findPathToNodeAtPoint(cursor, root_node)
        expect(maybe_path_1).toBeTruthy()
        // confirm it is the red square
        const path1 = maybe_path_1 as NodePath
        expect(path1.target().settings.kind).toBe("square")
        expect(path1.target().settings.visualStyle.background).toBe("red")

        let key = path1.target().settings.key

        {
            // now target the blue square
            const maybe_path_2 = findPathToNodeAtPoint(new Point(30, 10), root_node)
            expect(maybe_path_2).toBeTruthy()
            let path2 = maybe_path_2 as NodePath
            expect(path2.target().settings.kind).toBe("square")
            expect(path2.target().settings.visualStyle.background).toBe("blue")
        }


        // find node again using the key of the node
        const mabye_path_3 = findPathToNodeByKey(key,root_node)
        expect(mabye_path_3).toBeTruthy()
        const path3 = mabye_path_3 as NodePath
        // confirm it is the correct node
        expect(path3.target().settings.key).toEqual(path1.target().settings.key)
        // confirm the path is the right length
        expect(path3.count()).toBe(2)
        // convert a global point to a local one using the path
        let pos1 = new Point(10, 10)
        let pos2 = path3.toTargetPoint(pos1)
        // confirm the point is correct
        expect(pos2).toEqual(new Point(10, 10))

    })
})
