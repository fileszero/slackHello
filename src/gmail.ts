import dotenv from 'dotenv';
import * as imaps from 'imap-simple';

dotenv.config();
// https://github.com/chadxz/imap-simple

var config: imaps.ImapSimpleOptions = {
    imap: {
        user: process.env.GMAIL_ADDRESS || '',
        password: process.env.GMAIL_IMAP_PASSWARD || '',
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
    var client = await imaps.connect(config);
    await client.openBox('INBOX');
    client.on('mail', (args) => {
        console.log("new mail!" + args);
    });
})();