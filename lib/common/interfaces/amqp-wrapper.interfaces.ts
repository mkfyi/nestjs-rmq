import {
  Channel,
  CommonMessageFields,
  Connection,
  ConsumeMessageFields,
  Message as NativeMessage,
  MessageFields,
  MessageProperties,
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
  MessageFields,
  MessageProperties,
  NativeMessage,
  Options,
};

export { connect } from 'amqplib';
