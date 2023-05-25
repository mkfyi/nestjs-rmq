import {
  AmqpMessage,
  ConsumeMessageFields,
} from '../../common/interfaces/amqp-wrapper.interfaces';
import { Answer } from '../../common/interfaces/answer.interface';
import { ThrowOption } from '../../common/interfaces/message.interface';
// noinspection ES6PreferShortImport
import { Reply } from '../../common/interfaces/queue-handler.interface';
import { MessageWrapper, ReplyType } from './message.wrapper';

export class AnswerWrapper
  extends MessageWrapper<ConsumeMessageFields>
  implements Answer
{
  public readonly error?: string;
  public readonly message?: string | string[];

  public constructor(native: AmqpMessage<ConsumeMessageFields>) {
    super(native);

    if (this.getReplyType() === ReplyType.Json) {
      const { error, message } = this.object<Reply>();

      this.error = error;
      this.message = message;
    }
  }

  public text(): string;
  public text(options?: ThrowOption): string | undefined;
  public text(options?: ThrowOption | undefined): string | undefined {
    if (!options?.ignore && this.getReplyType() === ReplyType.Buffer) {
      return undefined;
    }
    return !options?.ignore && this.getReplyType() === ReplyType.Buffer
      ? undefined
      : this.content.toString();
  }

  public object<T = unknown>(): T;
  public object<T = unknown>(options?: ThrowOption): T | undefined;
  public object<T = unknown>(options?: ThrowOption | undefined): T | undefined {
    return !options?.ignore && this.getReplyType() === ReplyType.Buffer
      ? undefined
      : (JSON.parse(this.text()) as Reply<T>).payload;
  }
}
