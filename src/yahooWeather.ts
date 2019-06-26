import dotenv from 'dotenv';
import * as https from 'https';
import * as url from 'url';
import * as datefns from 'date-fns';
import { resolve } from 'path';
import { rejects } from 'assert';
import { Botkit } from 'botkit';
import { SlackBotWorker } from 'botbuilder-adapter-slack';
import { sendDirectMessage } from './slackBot';

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
    call_url.searchParams.append('appid', process.env.YAHOO_APP_ID || '');  // Yahoo アプリケーションID
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


let notice: "willRain" | "willSunny" | "stay" = 'stay';
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
    if (current.Rainfall == 0.0) {    // 今晴れてる
        const rain = forecast.find((f) => f.Rainfall > 0.0);
        if (rain && notice != "willRain") {
            [":closed_umbrella:", ":umbrella:", ":umbrella_with_rain_drops:"]
            message = location.name + "で、もうすぐ雨が降りそうです";
            notice = "willRain"
        } else if (!rain && notice == "willRain") {
            message = "やっぱり降らなさそうです";
            notice = "stay"
        }
    } else {    //今降ってる
        notice = "stay"
    }
    if (message != "") {
        return message;
    } else {
        console.log("no rain")
    }
    return "";
}

