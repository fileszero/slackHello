import * as fs from 'fs';
import * as readline from 'readline';
import dotenv from 'dotenv';

import { google } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';

// downloaded ClientSecret.json file data
interface ClientSecrets {
    installed: {
        client_id: string;
        project_id: string;
        auth_uri: string;
        token_uri: string;
        auth_provider_x509_cert_url: string;
        client_secret: string;
        redirect_uris: string[];
    }
};

dotenv.config();

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

///
/// File I/O
///
// Load client secrets from a local file.
function loadClientSecrets(): ClientSecrets {
    const content = fs.readFileSync(process.env.GOOGLE_CLIENT_SECRET_PATH || "", { encoding: "utf8" });
    return JSON.parse(content) as ClientSecrets;
}

// Store the token to disk for later program executions
function storeToken(token: Credentials) {
    fs.writeFileSync(process.env.GOOGLE_TOKEN_PATH || "", JSON.stringify(token));
}

// load if we have previously stored a token.
function loadToken(): Credentials {
    const token = fs.readFileSync(process.env.GOOGLE_TOKEN_PATH || "", { encoding: "utf8" });
    return JSON.parse(token) as Credentials;
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
async function authorize(credentials: ClientSecrets): Promise<OAuth2Client> {
    const oAuth2Client = new google.auth.OAuth2(
        credentials.installed.client_id, credentials.installed.client_secret, credentials.installed.redirect_uris[0]);

    // Check if we have previously stored a token.
    let token: Credentials;
    try {
        token = loadToken();
    } catch {   // no token.json
        token = await getAccessToken(oAuth2Client);
    };
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
async function getAccessToken(oAuth2Client: OAuth2Client): Promise<Credentials> {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Open this URL: ', authUrl);
    var code = await new Promise<string>((resolve, reject) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question('Paste Code: ', (code) => resolve(code));
    });

    const token = await oAuth2Client.getToken(code).catch((err) => {
        console.error('Error retrieving access token', err);
        throw err;
    });
    await storeToken(token.tokens);
    return token.tokens;
}


/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth: OAuth2Client) {
    const calendar = google.calendar({ version: 'v3', auth });
    const list = await calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    }).catch((err) => {
        console.log('The API returned an error: ' + err);
        throw err;
    });

    const events = list.data.items;

    if (events) {
        console.log('Upcoming 10 events:');
        events.map((event, i) => {
            let start = "";
            if (event.start) {
                start = event.start.dateTime || event.start.date || "Start Unknown";
            }
            console.log(`${start} - ${event.summary}`);
        });
    } else {
        console.log('No upcoming events found.');
    }
}

// entry point
(async () => {
    // Authorize a client with credentials, then call the Google Calendar API.
    const client_secret = await loadClientSecrets();
    const oAuth2Client = await authorize(client_secret);
    await listEvents(oAuth2Client);
})();
