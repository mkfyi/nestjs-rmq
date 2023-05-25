export class NotConnectedException {
  public readonly name = 'NotConnected';
  public readonly message: string;

  public constructor(alias: string) {
    this.message = `The ${alias} connection has not been established yet`;
  }
}
