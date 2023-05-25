import { Type } from '@nestjs/common';
import {
  AmqpMessage,
  CommonMessageFields,
  MessageFields,
} from './amqp-wrapper.interfaces';

export interface ThrowOption {
  ignore?: boolean;
}

export interface ValidateOption extends ThrowOption {
  strict?: boolean;
}

export type StrictRequiredType = { strict: true };

export interface Message<T extends CommonMessageFields = MessageFields>
  extends AmqpMessage<T> {
  getReplyTo(): string;
  getReplyTo(options: StrictRequiredType): string | null;
  getRoutingKey(): string;
  getRoutingKey(options: StrictRequiredType): string | null;
  getCorrelationId(): string;
  getCorrelationId(options: StrictRequiredType): string | null;

  text(options?: ThrowOption): string | undefined;
  object<T = unknown>(options?: ThrowOption): T | undefined;
  dto<T = any>(ctor: Type<T>, options?: ValidateOption): Promise<T>;
}
