export class PageNotFoundError extends Error {
  public constructor (pageNumber: number) {
    super(`${pageNumber} page is not in the collection.`)

    this.name = 'PageNotFoundError'
  }
}

export class CollectorError extends Error {
  public readonly name = 'CollectorError'
}
