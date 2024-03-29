import { BaseQueueAdapter } from './base.queue-adapter';
import { Connection } from '../../common/interfaces/connection.interface';
// noinspection ES6PreferShortImport
import { Channel } from '../../common/interfaces/amqp-wrapper.interfaces';
import { JsonService } from '../json.service';

export class ListenerQueueAdapter extends BaseQueueAdapter {
  public constructor(
    connection: Connection | null,
    queue: string,
    parser: JsonService,
  ) {
    super(connection, queue, parser);
  }

  protected async sendInternal(
    channel: Channel,
    payload: Buffer,
  ): Promise<boolean> {
    await channel.assertQueue(this.queue, { durable: false });

    return channel.sendToQueue(this.queue, payload);
  }
}
