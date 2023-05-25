import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  EXCEPTION_HANDLER_INJECTION_TOKEN,
  ROUTING_HANDLER_METADATA,
} from '../../common/constants';
// noinspection ES6PreferShortImport
import { Channel } from '../../common/interfaces/amqp-wrapper.interfaces';
import { ExceptionHandler } from '../../common/interfaces/exception-handler.interface';
import { QueueHandler } from '../../common/interfaces/queue-handler.interface';
import { RoutedQueueHandlerMetadata } from '../../common/interfaces/queue-handler.metadata'; // noinspection ES6PreferShortImport
import { MessageWrapper } from '../wrappers/message.wrapper';
import { Connections } from '../connections';
import { BaseQueueManager } from './base.queue-manager';

@Injectable()
export class RoutingQueueManager extends BaseQueueManager<
  void,
  RoutedQueueHandlerMetadata
> {
  public constructor(
    moduleRef: ModuleRef,
    connections: Connections,
    @Inject(EXCEPTION_HANDLER_INJECTION_TOKEN)
    exceptionHandler: ExceptionHandler,
  ) {
    super(moduleRef, connections, exceptionHandler, ROUTING_HANDLER_METADATA);
  }

  protected async bind(
    channel: Channel,
    handler: QueueHandler,
    metadata: RoutedQueueHandlerMetadata,
  ): Promise<void> {
    await channel.assertExchange(metadata.queue, 'direct', { durable: false });

    const { queue } = await channel.assertQueue('', { exclusive: true });

    await Promise.all(
      metadata.keys.map((key) => channel.bindQueue(queue, metadata.queue, key)),
    );

    await channel.consume(
      queue,
      (msg) => {
        if (msg !== null) {
          handler
            .execute(new MessageWrapper(msg))
            .catch((e) => this.exceptionHandler.handle(e, metadata.queue));
        }
      },
      { noAck: true },
    );
  }
}
