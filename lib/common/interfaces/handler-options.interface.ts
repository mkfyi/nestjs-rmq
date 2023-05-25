import { Type } from '@nestjs/common';
import { QueueHandler, RpcQueueHandler } from './queue-handler.interface';

export interface HandlerOptions {
  listener: Type<QueueHandler>[];
  pubSub: Type<QueueHandler>[];
  routing: Type<QueueHandler>[];
  rpc: Type<RpcQueueHandler>[];
  topics: Type<QueueHandler>[];
  worker: Type<QueueHandler>[];
}
