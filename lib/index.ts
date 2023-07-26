/**
 * RabbitMQ Module for NestJS
 * Copyright (c) 2023 - Michael Kilian
 * https://github.com/mkfyi
 * MIT Licensed
 */

export * from './common/exceptions/connection-failed.exception';
export * from './common/exceptions/duplicated-connection-alias.exception';
export * from './common/exceptions/invalid-connection.exception';
export * from './common/exceptions/not-connected.exception';
export * from './common/exceptions/unable-to-queue-remote-procedure-call.exception';
export * from './common/exceptions/validation.exception';

export * from './common/interfaces/amqp-wrapper.interfaces';
export * from './common/interfaces/answer.interface';
export * from './common/interfaces/connection.interface';
export * from './common/interfaces/exception-handler.interface';
export * from './common/interfaces/message.interface';
export * from './common/interfaces/queue-adapter.interface';
export * from './common/interfaces/queue-adapter-type.enum';
export * from './common/interfaces/queue-handler.interface';
export * from './common/interfaces/rabbitmq.module-options';
export * from './common/decorators';

export * from './core/json.service';

export * from './rabbitmq.module';
