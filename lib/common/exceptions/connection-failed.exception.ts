export class ConnectionFailedException {
  public readonly name = 'ConnectionFailed';
  public readonly message: string;

  public constructor(alias: string) {
    this.message = `Unable to create aliased connection ${alias}`;
  }
}
