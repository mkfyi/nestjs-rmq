import { QueueAdapter } from '../../common/interfaces/queue-adapter.interface';
import { Connection } from '../../common/interfaces/connection.interface';
import { InvalidConnectionException } from '../../common/exceptions/invalid-connection.exception';
// noinspection ES6PreferShortImport
import { Channel } from '../../common/interfaces/amqp-wrapper.interfaces';

export abstract class BaseQueueAdapter<Ret = boolean>
  implements QueueAdapter<Ret>
{
  protected constructor(
    protected readonly connection: Connection | null,
    protected readonly queue: string,
  ) {}

  /**
   * @throws ConnectionFailedException
   */
  public async connect(): Promise<void> {
    await this.connection?.connect();
  }

  /**
   * @throws InvalidConnectionException
   * @throws NotConnectedException
   */
  public async send<T>(data: T): Promise<Ret> {
    if (this.connection === null) {
      throw new InvalidConnectionException(this.queue);
    }

    const channel = await this.connection.channel();
    const result = await this.sendInternal(channel, this.pack(data));

    await channel.close();

    return result;
  }

  protected abstract sendInternal(
    channel: Channel,
    payload: Buffer,
  ): Promise<Ret>;

  protected pack<T>(data: T): Buffer {
    return data instanceof Buffer
      ? data
      : Buffer.from(
          data instanceof Uint8Array
            ? data
            : typeof data !== 'string'
              ? JSON.stringify(data)
              : data,
        );
  }
}
