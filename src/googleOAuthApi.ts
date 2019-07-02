import * as fs from 'fs';
import * as readline from 'readline';

import { google } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';
import config from './config';

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

export class GoogleOAuthApi {
    // If modifying these scopes, delete token.json.
    private _oAuth2Client: OAuth2Client | null;
    constructor(private ClientSecretPath: string = '', private TokenPath: string = '', private Scopes: string[] = []) {
        if (this.ClientSecretPath == '') {
            this.ClientSecretPath = config.google.clientSecretPath;
        }
        if (this.TokenPath == '') {
            this.TokenPath = config.google.tokenPath;
        }
        if (this.Scopes.length == 0) {
            this.Scopes = config.google.scopes;
        }
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
    public async authorize(): Promise<OAuth2Client> {
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
            scope: this.Scopes,
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
}