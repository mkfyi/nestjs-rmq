import { QueueAdapter } from '../../common/interfaces/queue-adapter.interface';
import { Connection } from '../../common/interfaces/connection.interface';
// noinspection ES6PreferShortImport
import { Channel } from '../../common/interfaces/amqp-wrapper.interfaces';

export abstract class BaseQueueAdapter<Ret = boolean>
  implements QueueAdapter<Ret>
{
  protected constructor(
    protected readonly connection: Connection,
    protected readonly queue: string,
  ) {}

  /**
   * @throws ConnectionFailedException
   */
  public connect(): Promise<void> {
    return this.connection.connect();
  }

  /**
   * @throws NotConnectedException
   */
  public async send<T>(data: T): Promise<Ret> {
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
