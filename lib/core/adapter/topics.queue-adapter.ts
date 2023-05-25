import { BaseQueueAdapter } from './base.queue-adapter';
import { Connection } from '../../common/interfaces/connection.interface';
// noinspection ES6PreferShortImport
import { Channel } from '../../common/interfaces/amqp-wrapper.interfaces';

export class TopicsQueueAdapter extends BaseQueueAdapter {
  public constructor(
    connection: Connection,
    queue: string,
    private readonly key: string,
  ) {
    super(connection, queue);
  }

  protected async sendInternal(
    channel: Channel,
    payload: Buffer,
  ): Promise<boolean> {
    await channel.assertExchange(this.queue, 'topic', { durable: false });

    return channel.publish(this.queue, this.key, payload);
  }
}
