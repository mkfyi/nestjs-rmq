import {
  AmqpMessage,
  ConsumeMessageFields,
} from '../../common/interfaces/amqp-wrapper.interfaces';
import { Answer } from '../../common/interfaces/answer.interface';
import { Json } from '../../common/interfaces/json.interface';
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

  public constructor(native: AmqpMessage<ConsumeMessageFields>, parser: Json) {
    super(native, parser);

    if (this.getReplyType() === ReplyType.Json) {
      // https://github.com/mkfyi/nestjs-rmq/issues/5
      // this.object() extracts the final payload property, so we can't use it here.
      const reply = this.parser.parse<Reply | null>(
        this.text({ ignore: true }) as string,
      );

      this.error = reply?.error ?? undefined;
      this.message = reply?.message ?? undefined;
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
      : this.parser.parse<Reply<T>>(this.text()).payload;
  }

  public get valid(): boolean {
    return this.error === undefined && this.message === undefined;
  }
}
