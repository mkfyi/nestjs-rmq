import { Answer } from './answer.interface';

export interface QueueAdapter<Ret = boolean> {
  send<T>(data: T): Promise<Ret>;
}

export type RpcQueueAdapter = QueueAdapter<Answer>;
