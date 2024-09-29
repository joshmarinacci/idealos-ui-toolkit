import {KEY_VENDOR} from "../keys.js";
import {MGlobals, useState} from "../base.js";
import {Scene} from "../scene.js";
import {TextElement} from "../text.js";
import {Style} from "../style.js";
import {Insets} from "josh_js_util";

export function makeClockApp() {
    const key = KEY_VENDOR.getKey()
    let [time, setTime] = useState<number>(key, "time", undefined, () => Date.now())
    setInterval(() => {
        setTime(Date.now())
        const scene = MGlobals.get(Scene.name)
        scene.markDirty()
    }, 100*100)
    return new TextElement({
        text: `${new Intl.DateTimeFormat("en-US", {
            timeStyle: 'medium',
        }).format(time)}`,
        visualStyle: {
            textColor: 'black'
        },
        fontSettings: {
            font: Style.base().font,
            fontSize: 80,
            fontWeight: Style.base().fontWeight,
        },
        shadow: false,
        padding: Insets.from(10),
    })
}
