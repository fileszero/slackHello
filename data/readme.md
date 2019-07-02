put data files and

DON'T include version control.

CONFIG_TS > cat ./src/config.ts | base64 -w 0 > ./data/base64_config_ts
GOOGLE_API_TOKEN > cat ./data/token.json | base64 -w 0 > ./data/base64_token.json
