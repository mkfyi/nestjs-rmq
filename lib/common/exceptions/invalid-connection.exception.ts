export class InvalidConnectionException {
  public readonly name = InvalidConnectionException.name.replace(
    'Exception',
    '',
  );

  public readonly message: string;

  public constructor(queue: string) {
    this.message = `The queue adapter for queue ${queue} does not own a connection`;
  }
}
