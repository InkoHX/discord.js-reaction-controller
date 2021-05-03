# discord.js-reaction-controller

[![Scrapbox](https://img.shields.io/badge/Scrapbox-docs-green)](https://scrapbox.io/discordjs-japan/リアクションを使って簡単にページネーションを作成するDiscord.js専用のパッケージ)

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
      .addReactionHandler('🤔', (reaction) => {
        reaction.message.channel.send('thinking')
          .catch(console.error)
      })

    controller.addPages([
      new Discord.MessageEmbed().setImage('https://github.com/yyx990803.png'),
      new Discord.MessageEmbed().setImage('https://github.com/egoist.png'),
      new Discord.MessageEmbed().setImage('https://github.com/vercel.png'),
      new Discord.MessageEmbed().setImage('https://github.com/Google.png'),
      new Discord.MessageEmbed().setImage('https://github.com/Microsoft.png')
    ])

    controller.sendTo(message.channel, message.author)
      .catch(console.error)
  }
})

client.login()
  .catch(console.error)
```

### Using Promise (Lazy Loading)

It is recommended to create a function that returns MessageEmbed with Promise and put it in the argument of addPages and addPage when there are many processes to access externally through the network.

That way, "discord.js-reaction-controller" will resolve the promises as needed and cache and display the MessageEmbed.

```js
const { Client, MessageEmbed } = require('discord.js')
const { ReactionController } = require('discord.js-reaction-controller')
const { getBasicInfo } = require('ytdl-core')

const client = new Client()

const fetchYouTubeVideoInfo = videoUrl => async () => {
  const { videoDetails } = await getBasicInfo(videoUrl)

  return new MessageEmbed()
    .setColor('RED')
    .setTitle(videoDetails.title)
    .setURL(videoDetails.video_url)
    .setImage(videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url)
    .setTimestamp(Date.parse(videoDetails.publishDate))
    .setFooter('Uploaded on')
    .setAuthor(videoDetails.author.name, videoDetails.author.thumbnails[0].url, videoDetails.author.channel_url)
}


const videos = [
  'https://youtu.be/sWbD5q769Ms',
  'https://youtu.be/0-zJNiSvz8Q',
  'https://youtu.be/1x2izJEN9p0',
  'https://youtu.be/gNp4VNr44hg',
  'https://youtu.be/Vi_asBY5UX8',
  'https://youtu.be/plqoPcKQnyE',
  'https://youtu.be/308I91ljCWg'
]

client.on('message', message => {
  if (message.content.startsWith('>pagination')) {
    const controller = new ReactionController(client)

    controller
      .addReactionHandler('🤔', (reaction) => {
        reaction.message.channel.send('thinking')
          .catch(console.error)
      })

    controller.addPages(videos.map(url => fetchYouTubeVideoInfo(url)))

    controller.sendTo(message.channel, message.author)
      .catch(console.error)
  }
})

client.login()
```
