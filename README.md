# slackHello
slack bot sample

## Create bots app and get API token
https://?????.slack.com/apps/search?q=bots

### windows
```
> SET  token=xoxb-XXXXXXXXXX-XXXXXXXXXXXXXXXXXX-XXXXXXXXXXXXXXXXX
> node dest\main.js
```

npm install forever -g

### OAuth Tokens & Redirect URLs
- chat:write:bot
- chat:write:user

### Event Subscriptions
need
- message.im
- message.channels

## Test on local
```
run > ngrok http 34567 --log stdout
```
access https://api.slack.com/apps

open app -> Event Subscriptions -> set Request URL http://???????.ngrok.io/api/messages


#### option
add
```
trust_host_root_certs: true
root_cas: host
```
to C:\Users\<user>\.ngrok2\ngrok.yml
