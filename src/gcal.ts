import * as fs from 'fs';
import * as readline from 'readline';
import dotenv from 'dotenv';

import { google, calendar_v3 } from 'googleapis';
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

class GoogleCalendar {
    // If modifying these scopes, delete token.json.
    static SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
    private _oAuth2Client: OAuth2Client | null;
    constructor(private ClientSecretPath: string, private TokenPath: string) {
        this._oAuth2Client = null;
    }
    ///
    /// File I/O
    ///
    // Load client secrets from a local file.
    private loadClientSecrets(): ClientSecrets {
        const content = fs.readFileSync(this.ClientSecretPath, { encoding: "utf8" });
        return JSON.parse(content) as ClientSecrets;
    }

    // Store the token to disk for later program executions
    private storeToken(token: Credentials) {
        fs.writeFileSync(this.TokenPath, JSON.stringify(token));
    }

    // load if we have previously stored a token.
    private loadToken(): Credentials {
        const token = fs.readFileSync(this.TokenPath, { encoding: "utf8" });
        return JSON.parse(token) as Credentials;
    }

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     */
    private async authorize(): Promise<OAuth2Client> {
        if (this._oAuth2Client) {   // already authorized
            return this._oAuth2Client;
        }
        const credentials: ClientSecrets = this.loadClientSecrets();
        this._oAuth2Client = new google.auth.OAuth2(
            credentials.installed.client_id, credentials.installed.client_secret, credentials.installed.redirect_uris[0]);

        // Check if we have previously stored a token.
        let token: Credentials;
        try {
            token = this.loadToken();
        } catch {   // no token.json
            token = await this.getAccessToken(this._oAuth2Client);
        };
        this._oAuth2Client.setCredentials(token);
        return this._oAuth2Client;
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     */
    private async  getAccessToken(oAuth2Client: OAuth2Client): Promise<Credentials> {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: GoogleCalendar.SCOPES,
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
        await this.storeToken(token.tokens);
        return token.tokens;
    }

    private async getCalendarAPI(): Promise<calendar_v3.Calendar> {
        const auth = await this.authorize();
        const calendar = google.calendar({ version: 'v3', auth });
        return calendar;
    }

    /**
     * Lists the next 10 events on the user's primary calendar.
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    public async  listEvents() {
        const api = await this.getCalendarAPI();
        const calendars = await api.calendarList.list();

        const list = await api.events.list({
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
}
// entry point
dotenv.config();
(async () => {
    const gcal = new GoogleCalendar(process.env.GOOGLE_CLIENT_SECRET_PATH || "", process.env.GOOGLE_TOKEN_PATH || "")
    // Authorize a client with credentials, then call the Google Calendar API.
    await gcal.listEvents();
})();
