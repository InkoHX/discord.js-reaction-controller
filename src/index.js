const Discord = require('discord.js')

class ReactionController {
  /**
   * @param {Discord.ReactionCollectorOptions} [options={}]
   */
  constructor(options) {
    /**
     * @type {Discord.ReactionCollectorOptions}
     */
    this.options = options

    /**
     * @type {Discord.Collection<number, *>}
     */
    this.pages = new Discord.Collection()

    /**
     * @type {number}
     */
    this.pageNumber = 1

    /**
     * @type {?Discord.ReactionCollector}
     */
    this.collector = null

    /**
     * @type {{ next: string, back: string, close: string }}
     */
    this.emojis = {
      back: '◀️',
      next: '▶️',
      close: '⏹️'
    }
  }

  /**
   * @param {Discord.StringResolvable|Discord.APIMessage} content
   * @param {Discord.MessageEditOptions|Discord.MessageEmbed} [options]
   * @returns {ReactionController}
   */
  addPage(content, options) {
    this.pages.set(this.pages.size + 1, { content, options })

    return this
  }

  /**
   * @param {Discord.Message} message
   * @returns {Promise<Discord.MessageReaction[]>}
   */
  async send(message) {
    const emojis = Object.values(this.emojis)
    const filter = (reaction, user) => emojis.includes(reaction.emoji.name) && user.id === message.author.id

    const firstPage = this.pages.first()

    const collector = await message.channel.send(firstPage.content, firstPage.options)
      .then(message => message.createReactionCollector(filter, this.options)
        .on('collect', (reaction, user) => this._handleCollectReaction(reaction, user))
        .on('end', () => message.reactions.removeAll())
      )

    this.collector = collector

    return Promise.all(emojis.map(emoji => collector.message.react(emoji)))
  }

  /**
   * @param {Discord.MessageReaction} reaction
   * @param {Discord.User} user
   * @private 
   */
  _handleCollectReaction (reaction, user) {
    const message = reaction.message
    const emoji = reaction.emoji

    if (emoji.name === this.emojis.next) {
      if (this.pageNumber >= this.pages.size) return reaction.users.remove(user)

      this.pageNumber += 1

      const data = this.pages.get(this.pageNumber)

      return message.edit(data.content, data.options)
        .then(() => reaction.users.remove(user))
        .catch(console.error)
    }

    if (emoji.name === this.emojis.back) {
      if (this.pageNumber <= 1) return reaction.users.remove(user)

      this.pageNumber -= 1

      const data = this.pages.get(this.pageNumber)

      return message.edit(data.content, data.options)
        .then(() => reaction.users.remove(user))
        .catch(console.error)
    }

    if (emoji.name === this.emojis.close) {
      this.collector.stop()

      return message.reactions.removeAll()
    }
  }
}

module.exports = ReactionController
