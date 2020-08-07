import dotenv from 'dotenv';
import * as https from 'https';
import * as url from 'url';
import * as datefns from 'date-fns';
import config from './config';
import cheerio from 'cheerio';
import * as fs from 'fs';

dotenv.config();

async function getKabuka(code: string): Promise<string> {
    const kabuka_url = new url.URL('https://kabutan.jp/stock/kabuka');
    kabuka_url.searchParams.append('code', code);
    kabuka_url.searchParams.append('ashi', 'day');
    kabuka_url.searchParams.append('page', '3');

    return new Promise((resolve, reject) => {
        https.get(kabuka_url.toString(), (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
                // const obj = JSON.parse(data) as WeatherResult;
                // resolve(obj);
            });
            res.on('error', (err) => {
                reject(err);
            });
        });
    });
}
function getInnerText(element: CheerioElement) {
    var text = '';
    if (element.children) {
        element.children.forEach((ele) => {
            text += ' ' + getInnerText(ele);
            text = text.trim();
        });
    }
    if (element.type == 'text') {
        text += ' ' + element.data;
        text = text.trim();
    }
    return text.trim();
}
// debug
(async () => {
    const html = await getKabuka('1348');
    // const html = fs.readFileSync('./data/ktsample.html', {});
    // console.log(html);
    const $ = cheerio.load(html);
    var msg = getInnerText($('.si_i1_1')[0]);
    var price = getInnerText($('.si_i1_2')[0]);
    price = price.replace('円', '').replace('前日比', '/').replace(' %', '%');
    console.log(msg + '\n' + price);
})();
