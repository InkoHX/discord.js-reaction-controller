import {
  Client,
  Collection,
  EmojiResolvable,
  GuildMember,
  Message,
  MessageEmbed,
  MessageReaction,
  PartialTextBasedChannelFields,
  ReactionCollector,
  ReactionCollectorOptions,
  User,
} from 'discord.js'
import util from 'util'

import { CollectorError, PageNotFoundError } from './error'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OverrideReturnType<F extends (...args: any[]) => any, T> = (...args: Parameters<F>) => T

export type ReactionCollectorEnd = (collected: Collection<string, Message>, reason: string) => void
export type ReactionCollectorFilter = (reaction: MessageReaction, user: User) => boolean
export type ReactionCollectorCollect = OverrideReturnType<ReactionCollectorFilter, void>
export type ReactionHandlerFunction = OverrideReturnType<ReactionCollectorCollect, void>

export class ReactionController {
  public readonly client: Client

  public readonly options?: ReactionCollectorOptions

  public readonly pages: Collection<number, MessageEmbed>

  public readonly handlers: Collection<string, ReactionHandlerFunction>

  private _currentPageNumber = 0

  private _collector: ReactionCollector | null = null

  public constructor (client: Client, options?: ReactionCollectorOptions) {
    this.client = client

    this.options = options

    this.pages = new Collection<number, MessageEmbed>()

    this.handlers = new Collection<string, ReactionHandlerFunction>()

    this._initReactionHandlers()
    
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.send = util.deprecate(this.send, 'The "send" method has been deprecated in v2.0.0. Use the "sendTo" method instead.')
  }

  public get currentPage (): number {
    return this._currentPageNumber
  }

  public async nextPage (): Promise<number> {
    const pageNumber = this._currentPageNumber + 1
    const page = this.pages.get(pageNumber)

    if (!this._collector) throw new CollectorError('Use the "sendTo" method, please register the Collector.')
    if (!page) throw new PageNotFoundError(pageNumber)

    await this._collector.message.edit(page)
    this._currentPageNumber = pageNumber
    
    return pageNumber
  }

  public async prevPage (): Promise<number> {
    const pageNumber = this._currentPageNumber - 1
    const page = this.pages.get(pageNumber)

    if (!this._collector) throw new CollectorError('Use the "sendTo" method, please register the Collector.')
    if (!page) throw new PageNotFoundError(pageNumber)

    await this._collector.message.edit(page)
    this._currentPageNumber = pageNumber
    
    return pageNumber
  }

  /**
   * @deprecated The "send" method has been deprecated in v2.0.0. Use the "sendTo" method instead.
   */
  public send (message: Message): Promise<MessageReaction[]> {
    return this.sendTo(message.channel, message.author)
  }

  public async sendTo (channel: PartialTextBasedChannelFields): Promise<MessageReaction[]>

  public async sendTo (channel: PartialTextBasedChannelFields, sender?: Array<User | GuildMember>) : Promise<MessageReaction[]>

  public async sendTo (channel: PartialTextBasedChannelFields, sender?: User | GuildMember): Promise<MessageReaction[]>

  public async sendTo (channel: PartialTextBasedChannelFields, sender?: User | GuildMember | Array<User | GuildMember>): Promise<MessageReaction[]> {
    const firstPage = this.pages.first()

    if (!firstPage) throw new Error('At least one page must be added using the "addPage" method.')

    const collectorFilter: ReactionCollectorFilter = (reaction, user) => {
      if (!this.handlers.has(reaction.emoji.identifier)) return false
      if (Array.isArray(sender)) return sender
        .map(sender => sender.id)
        .includes(user.id)
      else if (sender) return user.id === sender.id
      else return true
    }

    const onCollect: ReactionCollectorCollect = (reaction, user) => {
      const handler = this.handlers.get(reaction.emoji.identifier)

      if (handler) {
        reaction.users.remove(user)
          .catch(console.error)

        return handler(reaction, user)
      }

      throw new Error('Reaction Handler not found.')
    }

    const onEnd: ReactionCollectorEnd = () => this._collector?.message.reactions.removeAll().catch(console.error)

    const collector = await channel.send(firstPage)
      .then(message => message.createReactionCollector(collectorFilter, this.options))
      .then(collector => collector.on('collect', onCollect))
      .then(collector => collector.on('end', onEnd))

    this._collector = collector

    return Promise.all([...this.handlers.keys()].map(emoji => collector.message.react(emoji)))
  }

  public addReactionHandler (emoji: EmojiResolvable, handler: ReactionHandlerFunction): this {
    const emojiIdentifier = this.client.emojis.resolveIdentifier(emoji)

    if (!emojiIdentifier) throw new Error('It couldn\'t be an emoji identifier.')

    this.handlers.set(emojiIdentifier, handler)

    return this
  }

  public addPage (embed: MessageEmbed): this {
    this.pages.set(this.pages.size, embed)

    return this
  }

  public addPages (embeds: MessageEmbed[]): this {
    embeds.forEach(embed => this.pages.set(this.pages.size, embed))

    return this
  }

  private _initReactionHandlers (): void {
    this
      .addReactionHandler('◀️', (reaction, user) => {
        this.prevPage()
          .then(() => reaction.users.remove(user))
          .catch(reason => {
            if (reason instanceof PageNotFoundError) reaction.users.remove(user).catch(console.error)
            else console.error(reason)
          })
      })
      .addReactionHandler('▶️', (reaction, user) => {
        this.nextPage()
          .then(() => reaction.users.remove(user))
          .catch(reason => {
            if (reason instanceof PageNotFoundError) reaction.users.remove(user).catch(console.error)
            else console.error(reason)
          })
      })
      .addReactionHandler('⏹️', (reaction) => {
        this._collector?.stop()
        this._collector = null

        reaction.message.reactions.removeAll()
          .catch(console.error)
      })
  }
}

export * from './error'
