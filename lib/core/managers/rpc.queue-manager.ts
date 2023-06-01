import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  EXCEPTION_HANDLER_INJECTION_TOKEN,
  MESSAGE_HEADER_REPLY_TYPE,
  RPC_HANDLER_METADATA,
} from '../../common/constants';
// noinspection ES6PreferShortImport
import {
  Channel,
  ConsumeMessageFields,
} from '../../common/interfaces/amqp-wrapper.interfaces';
import { ExceptionHandler } from '../../common/interfaces/exception-handler.interface';
import {
  QueueHandler,
  Reply,
  RpcReturnTypes,
} from '../../common/interfaces/queue-handler.interface';
import { QueueHandlerMetadata } from '../../common/interfaces/queue-handler.metadata';
import { MessageWrapper, ReplyType } from '../wrappers/message.wrapper';
import { Connections } from '../connections';
import { BaseQueueManager } from './base.queue-manager';

@Injectable()
export class RpcQueueManager extends BaseQueueManager<RpcReturnTypes> {
  public constructor(
    moduleRef: ModuleRef,
    connections: Connections,
    @Inject(EXCEPTION_HANDLER_INJECTION_TOKEN)
    exceptionHandler: ExceptionHandler,
  ) {
    super(moduleRef, connections, exceptionHandler, RPC_HANDLER_METADATA);
  }

  protected async bind(
    channel: Channel,
    handler: QueueHandler<RpcReturnTypes>,
    metadata: QueueHandlerMetadata,
  ): Promise<void> {
    await channel.assertQueue(metadata.queue, { durable: false });
    await channel.prefetch(1);
    await channel.consume(metadata.queue, (msg) => {
      if (msg !== null) {
        const message = new MessageWrapper<ConsumeMessageFields>(msg);

        handler
          .execute(message)
          .then((reply) => this.reply(channel, message, { payload: reply }))
          .catch((e) =>
            this.reply(
              channel,
              message,
              this.exceptionHandler.handle(e, metadata.queue),
            ),
          )
          .finally(() => channel.ack(msg));
      }
    });
  }

  private reply(
    channel: Channel,
    msg: MessageWrapper<ConsumeMessageFields>,
    reply: Reply,
  ): boolean {
    return channel.sendToQueue(
      msg.getReplyTo() as string,
      reply.payload instanceof Buffer
        ? reply.payload
        : Buffer.from(
            reply.payload instanceof Uint8Array
              ? reply.payload
              : typeof reply.payload === 'object'
              ? JSON.stringify(reply.payload)
              : reply.payload != undefined
              ? `${reply.payload}`
              : JSON.stringify(reply),
          ),
      {
        headers: this.getReplyTypeHeaders(reply),
        correlationId: msg.getCorrelationId(),
      },
    );
  }

  private getReplyTypeHeaders(reply: Reply): Record<string, string> {
    const result = {} as Record<string, string>;

    if (reply.payload instanceof Uint8Array) {
      result[MESSAGE_HEADER_REPLY_TYPE] = ReplyType.Buffer.toString();
    } else {
      switch (typeof reply.payload) {
        case 'boolean':
          result[MESSAGE_HEADER_REPLY_TYPE] = ReplyType.Bool.toString();
          break;

        case 'number':
          result[MESSAGE_HEADER_REPLY_TYPE] = ReplyType.Number.toString();
          break;

        case 'string':
          result[MESSAGE_HEADER_REPLY_TYPE] = ReplyType.Text.toString();
          break;

        default:
          result[MESSAGE_HEADER_REPLY_TYPE] = ReplyType.Json.toString();
          break;
      }
    }

    return result;
  }
}
