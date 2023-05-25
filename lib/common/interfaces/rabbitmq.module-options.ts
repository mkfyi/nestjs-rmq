import { DynamicModule, Type } from '@nestjs/common';
// noinspection ES6PreferShortImport
import { Options } from './amqp-wrapper.interfaces';

export type ConnectionOptions = Options.Connect;
export type NamedConnectionOptions = ConnectionOptions & { name: string };

export interface RabbitMQModuleOptions {
  connection: ConnectionOptions | NamedConnectionOptions[];
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
    | RabbitMQModuleOptionsFactory[];
  exceptionHandler?: Type;
}
