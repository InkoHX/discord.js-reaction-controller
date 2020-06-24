# discord.js-reaction-controller

![Discord.js Reaction Controller](https://i.imgur.com/JOJJZF6.gif)

## Install

### Requirements

- Discord.js v12.2.0 or later

### NPM

```bash
npm install discord.js-reaction-controller
```

### Yarn

```bash
yarn add discord.js-reaction-controller
```

## Example of usage

```js
const Discord = require('discord.js')
const { ReactionController } = require('discord.js-reaction-controller')

const client = new Discord.Client()

client.on('message', message => {
  if (message.content.startsWith('>pagination')) {
    const controller = new ReactionController(client)

    controller
      .addReactionHandler('🤔', (reaction, user) => {
        reaction.message.channel.send('thinking')
          .catch(console.error)
      })

    controller
      .addPages([
        new Discord.MessageEmbed().setImage('https://github.com/yyx990803.png'),
        new Discord.MessageEmbed().setImage('https://github.com/egoist.png'),
        new Discord.MessageEmbed().setImage('https://github.com/vercel.png'),
        new Discord.MessageEmbed().setImage('https://github.com/Google.png'),
        new Discord.MessageEmbed().setImage('https://github.com/Microsoft.png')
      ])

    controller.send(message)
      .catch(console.error)
  }
})

client.login()
  .catch(console.error)
```
