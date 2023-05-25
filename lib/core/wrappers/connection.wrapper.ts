import { Connection } from '../../common/interfaces/connection.interface';
import {
  Channel,
  Connection as NativeConnection,
  connect,
} from '../../common/interfaces/amqp-wrapper.interfaces';
import { NamedConnectionOptions } from '../../common/interfaces/rabbitmq.module-options';
import { ConnectionFailedException } from '../../common/exceptions/connection-failed.exception';
import { snake } from '../utils/snake-case';
import { NotConnectedException } from '../../common/exceptions/not-connected.exception';

export class ConnectionWrapper implements Connection {
  private native?: NativeConnection;
  public constructor(private readonly options: NamedConnectionOptions) {}

  public get name(): string {
    return snake(this.options.name);
  }

  public get connected(): boolean {
    return this.native !== undefined;
  }

  /**
   * @throws ConnectionFailedException
   */
  public async connect(): Promise<void> {
    if (!this.connected) {
      try {
        this.native = await connect(this.options);
      } catch {
        throw new ConnectionFailedException(this.options.name);
      }
    }
  }

  public async close(): Promise<void> {
    if (this.connected) {
      await this.native?.close();

      this.native = undefined;
    }
  }

  public async channel(): Promise<Channel> {
    if (!this.connected) {
      throw new NotConnectedException(this.options.name);
    }

    return this.native?.createChannel() as Promise<Channel>;
  }
}
