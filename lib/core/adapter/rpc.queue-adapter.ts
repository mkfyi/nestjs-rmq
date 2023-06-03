import { randomUUID } from 'crypto';
import { UnableToQueueRemoteProcedureCallException } from '../../common/exceptions/unable-to-queue-remote-procedure-call.exception';
import { Connection } from '../../common/interfaces/connection.interface';
// noinspection ES6PreferShortImport
import { Channel } from '../../common/interfaces/amqp-wrapper.interfaces';
import { Answer } from '../../common/interfaces/answer.interface';
import { AnswerWrapper } from '../wrappers/answer.wrapper';
import { JsonService } from '../json.service';
import { BaseQueueAdapter } from './base.queue-adapter';

export class RpcQueueAdapter extends BaseQueueAdapter<Answer> {
  public constructor(
    connection: Connection | null,
    queue: string,
    private readonly parser: JsonService,
  ) {
    super(connection, queue);
  }

  /**
   * @throws UnableToQueueRemoteProcedureCallException
   */
  protected sendInternal(channel: Channel, payload: Buffer): Promise<Answer> {
    return new Promise<Answer>(async (resolve, reject) => {
      const id = randomUUID();
      const { queue } = await channel.assertQueue('', { exclusive: true });
      await channel.consume(
        queue,
        (msg) => {
          if (msg !== null) {
            const answer = new AnswerWrapper(msg, this.parser);

            if (answer.getCorrelationId() === id) {
              channel
                .deleteQueue(queue)
                .then(() => resolve(answer))
                .catch((e) => reject(e));
            }
          }
        },
        { noAck: true },
      );

      const result = channel.sendToQueue(this.queue, payload, {
        correlationId: id,
        replyTo: queue,
      });

      if (!result) {
        reject(new UnableToQueueRemoteProcedureCallException(this.queue));
      }
    });
  }
}
