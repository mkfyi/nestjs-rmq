import { Inject, Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  EXCEPTION_HANDLER_INJECTION_TOKEN,
  LISTENER_HANDLER_METADATA,
} from '../../common/constants';
// noinspection ES6PreferShortImport
import { Channel } from '../../common/interfaces/amqp-wrapper.interfaces';
import { ExceptionHandler } from '../../common/interfaces/exception-handler.interface';
import { QueueHandler } from '../../common/interfaces/queue-handler.interface';
import { QueueHandlerMetadata } from '../../common/interfaces/queue-handler.metadata'; // noinspection ES6PreferShortImport
import { MessageWrapper } from '../wrappers/message.wrapper';
import { Connections } from '../connections';
import { BaseQueueManager } from './base.queue-manager';

@Injectable()
export class ListenerQueueManager extends BaseQueueManager {
  public constructor(
    moduleRef: ModuleRef,
    connections: Connections,
    @Inject(EXCEPTION_HANDLER_INJECTION_TOKEN)
    exceptionHandler: ExceptionHandler,
  ) {
    super(moduleRef, connections, exceptionHandler, LISTENER_HANDLER_METADATA);
  }

  protected async bind(
    channel: Channel,
    handler: QueueHandler,
    metadata: QueueHandlerMetadata,
  ): Promise<void> {
    await channel.assertQueue(metadata.queue, { durable: false });
    await channel.consume(
      metadata.queue,
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
