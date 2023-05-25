import 'reflect-metadata';
import { Inject } from '@nestjs/common';
import { buildConnectionToken } from '../core/utils/build-connection-token';
import {
  QueueHandlerMetadata,
  RoutedQueueHandlerMetadata,
  TopicQueueHandlerMetadata,
} from './interfaces/queue-handler.metadata';
import {
  DEFAULT_CONNECTION_NAME,
  LISTENER_HANDLER_METADATA,
  PUB_SUB_ANDLER_METADATA,
  ROUTING_HANDLER_METADATA,
  RPC_HANDLER_METADATA,
  TOPICS_HANDLER_METADATA,
  WORKER_HANDLER_METADATA,
} from './constants';

const defineQueueMetadata =
  <T extends QueueHandlerMetadata>(
    metadataKey: string,
    metadata: T,
  ): ClassDecorator =>
  // eslint-disable-next-line @typescript-eslint/ban-types
  <T extends Function>(target: T): T | void => {
    metadata.connection ??= DEFAULT_CONNECTION_NAME;

    Reflect.defineMetadata(metadataKey, metadata, target);
  };

/**
 * Decorator the injects the ConnectionWrapper with `name` into your service.
 *
 * The decorated constructor parameter must be type `Connection`.
 */
export const InjectConnection = (name?: string): ReturnType<typeof Inject> =>
  Inject(buildConnectionToken(name ?? DEFAULT_CONNECTION_NAME));

/**
 * Decorator that marks a class as a RabbitMQ listener. A listener is the simplest thing
 * that does something. Basically direct transport between one sender and one receiver.
 *
 * The decorated class must implement the `QueueHandler` interface.
 *
 * @see https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html
 */
export const Listen = (metadata: QueueHandlerMetadata): ClassDecorator =>
  defineQueueMetadata(LISTENER_HANDLER_METADATA, metadata);

/**
 * Decorator that marks a class as a worker. A worker distributes
 * tasks among other workers.
 *
 * The decorated class must implement the `QueueHandler` interface.
 *
 * @see https://www.rabbitmq.com/tutorials/tutorial-two-javascript.html
 */
export const Worker = (metadata: QueueHandlerMetadata): ClassDecorator =>
  defineQueueMetadata(WORKER_HANDLER_METADATA, metadata);

/**
 * Decorator that marks a class as a RabbitMQ consumer. Many consumers are receiving
 * the same messages at once.
 *
 * The decorated class must implement the `QueueHandler` interface.
 *
 * @see https://www.rabbitmq.com/tutorials/tutorial-three-javascript.html
 */
export const PubSub = (metadata: QueueHandlerMetadata): ClassDecorator =>
  defineQueueMetadata(PUB_SUB_ANDLER_METADATA, metadata);

/**
 * Decorator that marks a class as a selectively RabbitMQ receiver.
 *
 * The decorated class must implement the `QueueHandler` interface.
 *
 * @see https://www.rabbitmq.com/tutorials/tutorial-four-javascript.html
 */
export const Routing = (metadata: RoutedQueueHandlerMetadata): ClassDecorator =>
  defineQueueMetadata(ROUTING_HANDLER_METADATA, metadata);

/**
 * Decorator that marks a class as a pattern based RabbitMQ receiver.
 *
 * The decorated class must implement the `QueueHandler` interface.
 *
 * @see https://www.rabbitmq.com/tutorials/tutorial-five-javascript.html
 */
export const Topics = (metadata: TopicQueueHandlerMetadata): ClassDecorator =>
  defineQueueMetadata(TOPICS_HANDLER_METADATA, metadata);

/**
 * Decorator that marks a class as a RabbitMQ replier. The sender waits
 * until an answer was received.
 *
 * The decorated class must implement the `RpcQueueHandler` interface.
 *
 * @see https://www.rabbitmq.com/tutorials/tutorial-six-javascript.html
 */
export const Rpc = (metadata: QueueHandlerMetadata): ClassDecorator =>
  defineQueueMetadata(RPC_HANDLER_METADATA, metadata);
