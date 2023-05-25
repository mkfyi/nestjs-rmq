export class UnableToQueueRemoteProcedureCallException {
  public readonly name = UnableToQueueRemoteProcedureCallException.name.replace(
    'Exception',
    '',
  );

  public readonly message: string;

  constructor(queue: string) {
    this.message = `Unable to queue remote procedure call for ${queue}`;
  }
}
