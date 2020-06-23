import {
  Client,
  Collection,
  EmojiResolvable,
  Message,
  MessageEmbed,
  MessageReaction,
  ReactionCollector,
  ReactionCollectorOptions,
  User
} from 'discord.js'

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

  #currentPageNumber = 0

  #collector: ReactionCollector | null = null

  public constructor (client: Client, options?: ReactionCollectorOptions) {
    this.client = client

    this.options = options

    this.pages = new Collection<number, MessageEmbed>()

    this.handlers = new Collection<string, ReactionHandlerFunction>()

    this._initReactionHandlers()
  }

  public async send (message: Message): Promise<Array<MessageReaction | undefined>> {
    const filter: ReactionCollectorFilter = (reaction, user) => this.handlers.has(reaction.emoji.identifier) && user.id === message.author.id
    const firstPage = this.pages.first()

    if (!firstPage) throw new Error('At least one page must be added using the "addPage" method.')

    const collect: ReactionCollectorCollect = (reaction, user) => {
      const handler = this.handlers.get(reaction.emoji.identifier)

      if (handler) return handler(reaction, user)
      else throw new Error('Reaction Handler not found.')
    }

    const end: ReactionCollectorEnd = () => message.reactions.removeAll()

    this.#collector = await message.channel.send(firstPage)
      .then(message => message.createReactionCollector(filter, this.options))
      .then(collector => collector.on('collect', collect))
      .then(collector => collector.on('end', end))

    return Promise.all([...this.handlers.keys()].map(emoji => this.#collector?.message?.react(emoji)))
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
        const pageNumber = this.#currentPageNumber - 1
        const embed = this.pages.get(pageNumber)

        if (!embed) {
          reaction.users.remove(user)
            .catch(console.error)

          return
        }

        this.#currentPageNumber = pageNumber

        reaction.message.edit(embed)
          .then(() => reaction.users.remove(user))
          .catch(console.error)
      })
      .addReactionHandler('▶️', (reaction, user) => {
        const pageNumber = this.#currentPageNumber + 1
        const embed = this.pages.get(pageNumber)

        if (!embed) {
          reaction.users.remove(user)
            .catch(console.error)

          return
        }

        this.#currentPageNumber = pageNumber

        reaction.message.edit(embed)
          .then(() => reaction.users.remove(user))
          .catch(console.error)
      })
      .addReactionHandler('⏹️', (reaction) => {
        // eslint-disable-next-line no-unused-expressions
        this.#collector?.stop()
        this.#collector = null

        reaction.message.reactions.removeAll()
          .catch(console.error)
      })
  }
}
