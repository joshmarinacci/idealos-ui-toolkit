import {KEY_VENDOR} from "../keys.js";
import {useState} from "../base.js";
import {Label} from "../text.js";

type WeatherObservation = {
    temperature: {
        value: number
    }
}
let weather: WeatherObservation | undefined

async function getWeather(): Promise<WeatherObservation | undefined> {
    if (weather) return weather
    // const url = "https://api.weather.gov/points/44.085,-123.1258"
    //GET https://api.weather.gov/stations/{stationId}/observations
    const url2 = "https://api.weather.gov/stations/KEUG/observations"
    let r = await fetch(url2, {
        headers: {
            "User-Agent": 'josh@josh.earth CoolDemo/0.0.1',
        }
    })
    let json = await r.json()
    // console.log("got json", json)

    // console.log(json.properties.relativeLocation.properties.city)
    const observation = json.features[0];
    // console.log("observation", observation.properties)
    console.log("temp is", observation.properties.temperature.value, observation.properties.temperature.unitCode)
    weather = observation.properties
}

export function makeWeatherApp() {
    const key = KEY_VENDOR.getKey()
    let [temp, setTemp] = useState<number>(key, "temp", undefined, () => 0)
    getWeather().then(weather => {
        let newtemp = weather ? weather.temperature.value : 0;
        if (newtemp !== temp) {
            setTemp(newtemp)
        }
    })
    return Label({
        text: `temp ${temp}`
    })
}
