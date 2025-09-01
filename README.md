# Epitech 2030 

A small fun project where anyone from the 2030 Epitech Lyon promo can
contribute by adding features.\
This bot is built with the [Sapphire
Framework](https://github.com/sapphiredev/framework) and written in
TypeScript.

## How to use it

### Prerequisites

``` sh
npm install
```

### Development

You can run this bot with `tsc-watch` to watch files and automatically
restart the bot when changes are detected.

``` sh
npm run watch:start
```

### Production

You can also run the bot with `npm run dev`.\
This will first build your code and then execute
`node ./dist/index.js`.\
Note: this is not the recommended way to run a bot in production.


### Docker

You can also run the bot using [Docker](https://docker.com).
You need a ```.env``` file like this:
```.dotenv
DISCORD_TOKEN="your_discord_token_here"
OPENAI_API_KEY="your_openai_token_here"
```

Then, execute this command:
```shell
docker-compose up --build -d
```

To stop the bot, execute this command:
```shell
docker-compose down
```

## License

Dedicated to the public domain via the
[Unlicense](https://github.com/sapphiredev/examples/blob/main/LICENSE.md),
courtesy of the Sapphire Community and its contributors.
