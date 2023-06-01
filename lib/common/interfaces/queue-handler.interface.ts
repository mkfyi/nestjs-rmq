import { Message } from './message.interface';

export interface Reply<T = unknown> {
  error?: string;
  message?: string | string[];
  payload?: T;
}

export interface QueueHandler<Ret = void> {
  execute(message: Message): Promise<Ret>;
}

export type RpcReturnTypes =
  | boolean
  | number
  | string
  | Uint8Array
  | Record<string, unknown>;

export type RpcQueueHandler<T extends RpcReturnTypes = RpcReturnTypes> =
  QueueHandler<T>;
