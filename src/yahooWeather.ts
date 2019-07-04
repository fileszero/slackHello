import dotenv from 'dotenv';
import * as https from 'https';
import * as url from 'url';
import * as datefns from 'date-fns';
import config from "./config";


// デベロッパーネットワークトップ > YOLP(地図) > 気象情報API
// https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/weather.html
// Yahoo application ID
// https://www.yahoo-help.jp/app/answers/detail/a_id/43398/p/537/related/1
// 5 Ways to Make HTTP Requests in Node.js
// https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
// 雨が降りそうになったらGoogle Homeに教えてもらえるようにした
// http://mst335.hatenablog.com/entry/2018/06/02/004229
dotenv.config();

interface WeatherResult {
    ResultInfo: {
        Count?: number,
        Total?: number,
        Start?: number,
        Status?: number,
        Latency?: number,
        Description?: string,
        Copyright?: string,
    },
    Feature: {
        Id?: string,
        Name?: string,
        Geometry?: { Type?: string, Coordinates?: string }
        Property: {
            WeatherAreaCode?: number,
            WeatherList: {
                Weather: {
                    Type: "observation" | "forecast",
                    Date: string,   //"201906260905"
                    Rainfall: number,   //0.00
                }[]
            }
        }
    }[],
}

interface WeatherLocation {
    name: string;
    coordinates: {
        longitude: number;  // 経度
        latitude: number;   // 緯度
    }
}
const API_URL = 'https://map.yahooapis.jp/weather/V1/place';

async function getWeather(location: WeatherLocation): Promise<WeatherResult> {
    const call_url = new url.URL(API_URL);
    call_url.searchParams.append('appid', config.yahoo.appId);  // Yahoo アプリケーションID
    call_url.searchParams.append('coordinates', location.coordinates.longitude + ',' + location.coordinates.latitude);  // 経度,緯度 coordinates=139.732293,35.663613
    call_url.searchParams.append('output', 'json');  // 出力形式 xml (default) or json
    call_url.searchParams.append('date', datefns.format(new Date(), 'YYYYMMDDHHmm'));   //日時を指定します（YYYYMMDDHHMI形式）。現在から2時間前までの日時を指定できます。
    call_url.searchParams.append('past', '1'); // 過去の降水強度実測値を取得する場合 0 - 取得しない（デフォルト）1 - 1時間前まで 2 - 2時間前まで

    return new Promise((resolve, reject) => {
        https.get(call_url.toString(), (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const obj = JSON.parse(data) as WeatherResult;
                resolve(obj);
            });
            res.on('error', (err) => {
                reject(err);
            });
        });
    });
}

type WeatherStatus = "willRain" | "willSunny" | "sunny" | "rain";
let currentStatus: WeatherStatus = 'sunny';
const rain_levels = [":sunny:", ":rain_0_1:", ":rain_1_3:", ":rain_4_10:", ":rain_11_20:", ":rain_21:"];
function levelString(forecast: { Rainfall: number }[]) {
    const levels = forecast.map((f) => {
        if (f.Rainfall == 0) return rain_levels[0];
        if (f.Rainfall < 1) return rain_levels[1];
        if (f.Rainfall < 3) return rain_levels[2];
        if (f.Rainfall < 10) return rain_levels[3];
        if (f.Rainfall < 20) return rain_levels[4];
        return rain_levels[5];
    });
    return levels.join(" ");
}
export async function sendRainNotice(): Promise<string> {
    const location: WeatherLocation = {
        name: "泉区",
        coordinates: { longitude: 139.5246846, latitude: 35.4309522 }
    }
    let message = "";
    const wz = await getWeather(location);
    const observations = wz.Feature[0].Property.WeatherList.Weather.filter((w) => w.Type == "observation");
    const forecast = wz.Feature[0].Property.WeatherList.Weather.filter((w) => w.Type == "forecast");
    const current = forecast[0];    //observations[observations.length - 1];
    const rains = forecast.filter((f) => f.Rainfall > 0.0);
    const totalRainfall = forecast.map((f) => f.Rainfall).reduce((val, cur) => val + cur);
    let next_status: WeatherStatus | undefined = undefined;

    if (rains.length >= forecast.length / 2 || forecast[0].Rainfall > 0) {
        // 半分以上が雨か、直近が雨なら、もうすぐ雨
        next_status = "rain";
    } else if (totalRainfall < 1) { //1ミリ以下は晴れ
        next_status = "sunny";
    }
    if (next_status) {
        if (currentStatus == "willSunny" && next_status == "sunny") {
            // 晴れそう→晴れ
            currentStatus = "sunny";
        } else if (currentStatus == "willRain" && next_status == "rain") {
            // 降りそう→雨
            currentStatus = "rain";
        } else if ((currentStatus == "sunny" || currentStatus == "willSunny") && next_status == "rain") {
            // 晴れ→雨
            message = location.name + "で、もうすぐ雨が降りそうです";
            currentStatus = "willRain";
        } else if ((currentStatus == "rain" || currentStatus == "willRain") && next_status == "sunny") {
            // 雨→晴れ
            message = location.name + "で、もうすぐ晴れそうです";
            currentStatus = "willSunny";
        }
    }
    if (message != "") {
        return message += "\n" + levelString(forecast);
    } else {
        console.log("そのまま" + levelString(forecast) + totalRainfall);
    }
    return "";
}

// debug
// (async () => {
//     let message = await sendRainNotice();
//     console.log(message);
//     message = await sendRainNotice();
//     console.log(message);
// })();
