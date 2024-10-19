import { Type } from '@nestjs/common';
import { ClassTransformOptions } from '@nestjs/common/interfaces/external/class-transform-options.interface';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
// noinspection ES6PreferShortImport
import {
  AmqpMessage,
  CommonMessageFields,
  MessageFields,
  MessageProperties,
} from '../../common/interfaces/amqp-wrapper.interfaces';
import {
  Message,
  ValidateOption,
} from '../../common/interfaces/message.interface';
import { MESSAGE_HEADER_REPLY_TYPE } from '../../common/constants';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { Json } from '../../common/interfaces/json.interface';

export enum ReplyType {
  Buffer = 0,
  Text,
  Json,
  Bool,
  Number,
}

export class MessageWrapper<T extends CommonMessageFields = MessageFields>
  implements Message<T>
{
  public readonly content: Buffer;
  public readonly fields: T;
  public readonly properties: MessageProperties;

  public constructor(
    native: AmqpMessage<T>,
    protected readonly parser: Json,
  ) {
    Object.assign(this, native);
  }

  public getReplyTo(): string;
  public getReplyTo(options: { strict: true }): string | null;
  public getReplyTo(options?: { strict: true }): string | null {
    const { replyTo } = this.properties;

    return options?.strict ? replyTo ?? null : replyTo;
  }

  public getRoutingKey(): string;
  public getRoutingKey(options: { strict: true }): string | null;
  public getRoutingKey(options?: { strict: true }): string | null {
    const { routingKey } = this.fields;

    return options?.strict ? routingKey ?? null : routingKey;
  }

  public getCorrelationId(): string;
  public getCorrelationId(options: { strict: true }): string | null;
  public getCorrelationId(options?: { strict: true }): string | null {
    const { correlationId } = this.properties;

    return options?.strict ? correlationId ?? null : correlationId;
  }

  public text(): string {
    return this.content.toString();
  }

  public object<T = unknown>(): T {
    return this.parser.parse<T>(this.text());
  }

  public async dto<T>(
    ctor: Type<T>,
    options?: ValidateOption & ClassTransformOptions,
  ): Promise<T> {
    const instance = plainToInstance(ctor, this.object<T>(), options) as T;

    if (!options?.ignore) {
      const errors = await validate(instance as ClassConstructor<T>);

      if (errors.length > 0) {
        throw new ValidationException(ctor, ...errors);
      }
    }

    return instance;
  }

  protected getReplyType(): ReplyType {
    const replyType = (this.properties.headers ?? {})[
      MESSAGE_HEADER_REPLY_TYPE
    ];

    return replyType !== null && replyType !== undefined
      ? parseInt(replyType)
      : ReplyType.Buffer;
  }
}
