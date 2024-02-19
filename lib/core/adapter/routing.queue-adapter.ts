import { BaseQueueAdapter } from './base.queue-adapter';
import { Connection } from '../../common/interfaces/connection.interface';
// noinspection ES6PreferShortImport
import { Channel } from '../../common/interfaces/amqp-wrapper.interfaces';
import { JsonService } from '../json.service';

export class RoutingQueueAdapter extends BaseQueueAdapter {
  public constructor(
    connection: Connection | null,
    queue: string,
    parser: JsonService,
    private readonly route: string,
  ) {
    super(connection, queue, parser);
  }

  protected async sendInternal(
    channel: Channel,
    payload: Buffer,
  ): Promise<boolean> {
    await channel.assertExchange(this.queue, 'direct', { durable: false });

    return channel.publish(this.queue, this.route, payload);
  }
}
