# slackHello
slack bot sample

## Create bots app and get API token
https://?????.slack.com/apps/search?q=bots

### windows
```
> SET  token=xoxb-XXXXXXXXXX-XXXXXXXXXXXXXXXXXX-XXXXXXXXXXXXXXXXX
> node dest\main.js
```

### crontab sample

```
15 6 * * * node <path to project>/dest/scheduleNotice.js

```
command will be ```% crontab ~/.crontab```