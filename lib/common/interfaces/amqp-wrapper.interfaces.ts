import {
  Channel,
  CommonMessageFields,
  Connection,
  ConsumeMessageFields,
  Message as NativeMessage,
  Options,
} from 'amqplib';

export interface AmqpMessage<T extends CommonMessageFields>
  extends Omit<NativeMessage, 'fields'> {
  fields: T;
}

export type {
  Channel,
  CommonMessageFields,
  ConsumeMessageFields,
  Connection,
  NativeMessage,
  Options,
};
