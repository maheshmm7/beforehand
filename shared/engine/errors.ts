/** Thrown when a pack refers to something that does not exist, or refers to
 *  itself. Packs are authored in this repository, so this is a bug, not input. */
export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EngineError';
  }
}
