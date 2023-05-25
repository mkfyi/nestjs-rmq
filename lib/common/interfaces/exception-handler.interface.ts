import { Reply } from './queue-handler.interface';

export type HandlerResult = Required<Omit<Reply, 'payload'>>;

export interface ExceptionHandler {
  handle<T>(error: T, queue: string): HandlerResult;
}
