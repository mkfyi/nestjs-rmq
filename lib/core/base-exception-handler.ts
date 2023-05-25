import { Injectable, Logger } from '@nestjs/common';
import {
  ExceptionHandler,
  HandlerResult,
} from '../common/interfaces/exception-handler.interface';

@Injectable()
export class BaseExceptionHandler implements ExceptionHandler {
  protected readonly logger: Logger;

  public constructor(loggerName?: string) {
    this.logger = new Logger(loggerName ?? 'RabbitMQ', { timestamp: false });
  }

  public handle<T>(error: T, queue: string): HandlerResult {
    const { message, name } = error as Pick<HandlerResult, 'message'> & {
      name?: string;
    };

    this.logger.error(
      Array.isArray(message) ? message[0] : message,
      undefined,
      `RabbitMQ (${queue})`,
    );

    return { error: name ?? 'Error', message };
  }
}
