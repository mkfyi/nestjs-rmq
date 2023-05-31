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

    const [modifier, messages] = this.collectAndAssembleErrorMessages(message);

    this.logger.error(
      [
        `received ${name} in ${queue} queue: `.concat(modifier ?? ''),
        ...messages,
      ].join('\n'),
    );

    return { error: name ?? 'Error', message };
  }

  private collectAndAssembleErrorMessages(
    message: string | string[],
  ): [string | null, string | string[]] {
    const messages = [] as string[];
    let modifier = null as string | null;

    if (Array.isArray(message)) {
      if (message.length > 1) {
        messages.push(...message.map((s) => '\t- '.concat(s)));
      } else {
        modifier = message.shift() as string;
      }
    } else {
      modifier = message;
    }

    return [modifier, messages];
  }
}
