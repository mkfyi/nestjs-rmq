import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  EXCEPTION_HANDLER_INJECTION_TOKEN,
  TOPICS_HANDLER_METADATA,
} from '../../common/constants';
// noinspection ES6PreferShortImport
import { Channel } from '../../common/interfaces/amqp-wrapper.interfaces';
import { ExceptionHandler } from '../../common/interfaces/exception-handler.interface';
import { QueueHandler } from '../../common/interfaces/queue-handler.interface';
import { TopicQueueHandlerMetadata } from '../../common/interfaces/queue-handler.metadata'; // noinspection ES6PreferShortImport
import { MessageWrapper } from '../wrappers/message.wrapper';
import { Connections } from '../connections';
import { BaseQueueManager } from './base.queue-manager';
import { JsonService } from '../json.service';

@Injectable()
export class TopicsQueueManager extends BaseQueueManager<
  void,
  TopicQueueHandlerMetadata
> {
  public constructor(
    moduleRef: ModuleRef,
    connections: Connections,
    @Inject(EXCEPTION_HANDLER_INJECTION_TOKEN)
    exceptionHandler: ExceptionHandler,
    parser: JsonService,
  ) {
    super(
      moduleRef,
      connections,
      exceptionHandler,
      parser,
      TOPICS_HANDLER_METADATA,
    );
  }

  protected async bind(
    channel: Channel,
    handler: QueueHandler,
    metadata: TopicQueueHandlerMetadata,
  ): Promise<void> {
    await channel.assertExchange(metadata.queue, 'topic', { durable: false });

    const { queue } = await channel.assertQueue('', { exclusive: true });

    await Promise.all(
      metadata.pattern.map((pattern) =>
        channel.bindQueue(queue, metadata.queue, pattern),
      ),
    );

    await channel.consume(
      queue,
      (msg) => {
        if (msg !== null) {
          handler
            .execute(new MessageWrapper(msg, this.parser))
            .catch((e) => this.exceptionHandler.handle(e, metadata.queue));
        }
      },
      { noAck: true },
    );
  }
}
