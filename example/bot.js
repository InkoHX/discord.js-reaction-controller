const Discord = require('discord.js')
const client = new Discord.Client()

const ReactionController = require('../src')

const embedOne = new Discord.MessageEmbed()
  .setColor('GREEN')
  .setTitle('InkoHX')
  .addField('HP', 9999)

const embedTow = new Discord.MessageEmbed()
  .setColor('RED')
  .setTitle('I love parrot.')
  .setDescription('THIS IS PARROT.')

const embedThree = new Discord.MessageEmbed()
  .setColor('BLUE')
  .setTitle('Super man')
  .setTimestamp()

client.once('ready', () => console.log('READY!'))

client.on('message', message => {
  if (message.system || message.author.bot) return
  
  if (message.content === '!reaction') {
    const controller = new ReactionController()
      .addPage(embedOne)
      .addPage(embedTow)
      .addPage(embedThree)

    return controller.send(message)
  }
})

client.login()
  .catch(console.error)