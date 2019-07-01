import dotenv from 'dotenv';
import * as imaps from 'imap-simple';
import config from "./config";

dotenv.config();
// https://github.com/chadxz/imap-simple

var imap_config: imaps.ImapSimpleOptions = {
    imap: {
        user: config.gmail.address,
        password: config.gmail.imapPassword,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 3000
    },
    // onmail: function (numNewMail: number) {
    //     console.log("new mail!" + numNewMail.toString());
    // }
};

(async () => {
    var client = await imaps.connect(imap_config);
    await client.openBox('INBOX');
    client.on('mail', (args) => {
        console.log("new mail!" + args);
    });
})();