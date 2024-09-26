import {describe, expect, it} from "vitest";
import pureimage from "pureimage";
import {Bounds, Size} from "josh_js_util";
import * as fs from "node:fs";
import {intersectBounds, isBoundsValid} from "./util.js";


describe("pureimage fillRect performance", () => {
    it("should calculate the intersection of two rectangles", () => {
        const b1 = new Bounds(0,0,200,200)
        const b2 = new Bounds(50,50,50,50)
        expect(intersectBounds(b1,b2)).toEqual(new Bounds(50,50,50,50))
        expect(intersectBounds(b2,b1)).toEqual(new Bounds(50,50,50,50))
        const b3 = new Bounds(20,20,100,100)
        expect(intersectBounds(b3,b2)).toEqual(new Bounds(50,50,50,50))
        expect(intersectBounds(b1,b3)).toEqual(b3)
        const b4 = new Bounds(-50,-50,100,100)
        expect(intersectBounds(b4,b1)).toEqual(new Bounds(0,0,50,50))

        const b5 = new Bounds(0,0,10,10)
        expect(intersectBounds(b5,b3)).toEqual(new Bounds(20,20,-10,-10))

        expect(isBoundsValid(intersectBounds(b1,b2))).toBeTruthy()
        expect(isBoundsValid(intersectBounds(b5,b3))).toBeFalsy()

    })
    it("should draw a rect", () => {
        const size = new Size(1024,1024)
        const img =  pureimage.make(size.w, size.h)
        const ctx = img.getContext('2d')
        ctx.fillStyle = 'red'
        console.time("draw")
        ctx.fillRect(0,0,img.width, img.height)
        console.timeEnd("draw")
    })
    it("should draw a rect faster", () => {
        const size = new Size(1024,1024)
        const img =  pureimage.make(size.w, size.h)
        const ctx = img.getContext('2d')
        ctx.fillStyle = 'red'
        console.log("fill color is",ctx._fillColor)
        console.time("draw")
        for(let i=0; i<size.w; i++) {
            for(let j=0; j<size.h; j++) {
                img.setPixelRGBA(i,j,ctx._fillColor)
            }
        }
        // ctx.fillRect(0,0,img.width, img.height)
        console.timeEnd("draw")
    })

    it("should draw a rect even faster", async () => {
        const size = new Size(1024,1024)
        const img =  pureimage.make(size.w, size.h)
        let arr = new ArrayBuffer(size.w*size.h*4)
        img.data =  new Uint8ClampedArray(arr)
        // clear with black
        {
            let arr32 = new Uint32Array(arr)
            arr32.fill(0xFF000000,0,arr32.length)
        }



        const ctx = img.getContext('2d')
        ctx.fillStyle = 'red'
        ctx.beginPath()
        ctx.arc(512,512,256,0,Math.PI)
        ctx.fill()

        // img.data.fill(0,32*32*1,32*32*2)


        const bounds = new Bounds(0,0,size.w,size.h)
        console.time("draw")
        // // // console.log("img data len is",img.data.length)
        // // // img.data.fill(color,0,1024*1024)
        {
            let arr32 = new Uint32Array(arr)
            // // console.log("is view",arr.isView())
            //alpha, blue, green, red
            const GREEN = 0xFF00FF00
            for (let j = bounds.y; j < bounds.bottom(); j++) {
                // console.log("row",j)
                let start = j * size.w + bounds.x
                let end = start + bounds.w
                // arr32.fill(GREEN, start, end)
            }
            console.timeEnd("draw")
        }
        await pureimage.encodePNGToStream(img, fs.createWriteStream("out.png"))
        // ctx.fillRect(0,0,img.width, img.height)
    })
})
