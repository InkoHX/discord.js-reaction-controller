# discord.js-reaction-controller

![status](https://img.shields.io/badge/STATUS-ALPHA-red)

## Example of use

```js
const Discord = require('discord.js')
const ReactionController = require('discord.js-reaction-controller')

const client = new Discord.Client()

client.on('message', message => {
  if (message.system || message.author.bot) return

  if (message.content === '!help') {
    const controller = new ReactionController({ /** ReactionCollectorOptions */ })
      .addPage(new Discord.MessageEmbed().setTitle('ping').setDescription('pong'))
      .addPage(new Discord.MessageEmbed().setTitle('help').setDescription('command list'))

    return controller.send(message)
  }
})

client.login()
  .catch(console.error)
```
