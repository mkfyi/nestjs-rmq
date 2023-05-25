import { DynamicModule, Type } from '@nestjs/common';
// noinspection ES6PreferShortImport
import { Options } from './amqp-wrapper.interfaces';
import { ExceptionHandler } from './exception-handler.interface';
import { QueueAdapterType } from './queue-adapter-type.enum';

export interface ConnectionOptions extends Options.Connect {
  /**
   * Determines if the connection will be automatically established during
   * onApplicationBootstrap() lifecycle. (default: true)
   */
  autoConnect?: boolean;
}

export interface NamedConnectionOptions extends ConnectionOptions {
  /**
   * When using more than one connection, each connection must have its own
   * unique name. When using only one connection without a specific name,
   * "default" will be used.
   */
  name: string;
}

export interface QueueAdapterOptions {
  name: string;
  queue: string;
  type: QueueAdapterType;
  connection?: string;
}

export type RoutedQueueAdapterOptions = QueueAdapterOptions & { route: string };
export type TopicQueueAdapterOptions = QueueAdapterOptions & {
  pattern: string;
};

export const isRoutedQueueAdapterOptions = (
  data: QueueAdapterOptions,
): data is RoutedQueueAdapterOptions => data.type === QueueAdapterType.Routing;

export const isTopicQueueAdapterOptions = (
  data: QueueAdapterOptions,
): data is TopicQueueAdapterOptions => data.type === QueueAdapterType.Topics;

export interface BaseModuleOptions<T> {
  connection: T;
  exceptionHandler?: Type<ExceptionHandler>;
  adapters?: (
    | QueueAdapterOptions
    | RoutedQueueAdapterOptions
    | TopicQueueAdapterOptions
  )[];
}

export interface RabbitMQModuleOptionsFactory
  extends Pick<DynamicModule, 'imports'> {
  name: string;
  useFactory: (
    ...args: any[]
  ) => Promise<ConnectionOptions> | ConnectionOptions;
  inject?: any[];
}

export type RabbitMQModuleOptions = BaseModuleOptions<
  | ConnectionOptions
  | (Omit<NamedConnectionOptions, 'name'> & { name?: string })
  | NamedConnectionOptions[]
>;

export type RabbitMQModuleAsyncOptions = BaseModuleOptions<
  | Omit<RabbitMQModuleOptionsFactory, 'name'>
  | (Omit<RabbitMQModuleOptionsFactory, 'name'> & { name?: string })
  | RabbitMQModuleOptionsFactory[]
>;
