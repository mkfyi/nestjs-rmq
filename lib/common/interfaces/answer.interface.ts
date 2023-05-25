import { Message, ThrowOption } from './message.interface';
// noinspection ES6PreferShortImport
import { ConsumeMessageFields } from './amqp-wrapper.interfaces';

export interface Answer extends Message<ConsumeMessageFields> {
  readonly error?: string;
  readonly message?: string | string[];

  text(): string;
  text(options?: ThrowOption): string | undefined;

  object<T = unknown>(): T;
  object<T = unknown>(options?: ThrowOption): T | undefined;
}
