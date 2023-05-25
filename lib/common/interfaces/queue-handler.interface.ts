import { Message } from './message.interface';

export interface Reply<T = unknown> {
  error?: string;
  message?: string | string[];
  payload?: T;
}

export interface QueueHandler<Ret = void> {
  execute(message: Message): Promise<Ret>;
}

export type RpcQueueHandler<T = unknown> = QueueHandler<Reply<T>>;
