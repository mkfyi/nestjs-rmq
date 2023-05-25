import { BaseQueueAdapter } from './base.queue-adapter';
import { Connection } from '../../common/interfaces/connection.interface';
// noinspection ES6PreferShortImport
import { Channel } from '../../common/interfaces/amqp-wrapper.interfaces';

export class WorkerQueueAdapter extends BaseQueueAdapter {
  public constructor(connection: Connection | null, queue: string) {
    super(connection, queue);
  }

  protected async sendInternal(
    channel: Channel,
    payload: Buffer,
  ): Promise<boolean> {
    await channel.assertQueue(this.queue, { durable: true });

    return channel.sendToQueue(this.queue, payload, { persistent: true });
  }
}
