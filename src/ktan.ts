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
// debug
(async () => {
    //const html = await getKabuka('1348');
    const html = fs.readFileSync('./data/ktsample.txt', {});
    // console.log(html);
    const $ = cheerio.load(html);
    console.log($('title').text().split('：')[0]);
})();
