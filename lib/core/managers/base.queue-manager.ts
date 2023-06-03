import { ModuleRef } from '@nestjs/core';
import { Type } from '@nestjs/common';
import { QueueHandler } from '../../common/interfaces/queue-handler.interface';
import { ExceptionHandler } from '../../common/interfaces/exception-handler.interface';
import { QueueHandlerMetadata } from '../../common/interfaces/queue-handler.metadata';
// noinspection ES6PreferShortImport
import { Channel } from '../../common/interfaces/amqp-wrapper.interfaces';
import { Json } from '../../common/interfaces/json.interface';
import { Connections } from '../connections';

const HANDLER_METADATA = Symbol.for('zmq.manager.handler_metadata');

export abstract class BaseQueueManager<
  Ret = void,
  Metadata extends QueueHandlerMetadata = QueueHandlerMetadata,
> {
  private readonly [HANDLER_METADATA]: string;

  protected handlers = new Map<
    string,
    { handler: Type<QueueHandler<Ret>>; active?: boolean }
  >();

  protected constructor(
    protected readonly moduleRef: ModuleRef,
    protected readonly connections: Connections,
    protected readonly exceptionHandler: ExceptionHandler,
    protected readonly parser: Json,
    metadataKey: string,
  ) {
    this[HANDLER_METADATA] = metadataKey;
  }

  public async apply(): Promise<void> {
    await Promise.all(
      [...this.handlers.values()]
        .filter(({ active }) => !active)
        .map(async (entry): Promise<void> => {
          const metadata = this.extractMetadata(
            this[HANDLER_METADATA],
            entry.handler,
          );

          const connection = this.connections.get(
            metadata.connection as string,
          );

          if (connection !== null && connection.connected) {
            await this.bind(
              await connection.channel(),
              this.moduleRef.get(entry.handler, { strict: false }),
              metadata,
            );

            entry.active = true;
          }
        }),
    );
  }

  public register(handlers: Type<QueueHandler<Ret>>[]): void {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  protected abstract bind(
    channel: Channel,
    handler: QueueHandler<Ret>,
    metadata: Metadata,
  ): Promise<void>;

  protected registerHandler(handler: Type<QueueHandler<Ret>>): void {
    if (!this.handlers.has(handler.name)) {
      this.handlers.set(handler.name, { handler });
    }
  }

  protected extractMetadata(
    metadataKey: string,
    handler: Type<QueueHandler<Ret>>,
  ): Required<Metadata> {
    return Reflect.getMetadata(metadataKey, handler) as Required<Metadata>;
  }
}
