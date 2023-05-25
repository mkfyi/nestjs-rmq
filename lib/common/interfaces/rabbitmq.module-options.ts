import { DynamicModule, Type } from '@nestjs/common';
// noinspection ES6PreferShortImport
import { Options } from './amqp-wrapper.interfaces';

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

export interface RabbitMQModuleOptions {
  connection:
    | ConnectionOptions
    | (Omit<NamedConnectionOptions, 'name'> & { name?: string })
    | NamedConnectionOptions[];
  exceptionHandler?: Type;
}

export interface RabbitMQModuleOptionsFactory
  extends Pick<DynamicModule, 'imports'> {
  name: string;
  useFactory: (
    ...args: any[]
  ) => Promise<ConnectionOptions> | ConnectionOptions;
  inject?: any[];
}

export interface RabbitMQModuleAsyncOptions {
  connection:
    | Omit<RabbitMQModuleOptionsFactory, 'name'>
    | (Omit<RabbitMQModuleOptionsFactory, 'name'> & { name?: string })
    | RabbitMQModuleOptionsFactory[];
  exceptionHandler?: Type;
}
