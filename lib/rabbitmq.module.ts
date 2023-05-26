import {
  DynamicModule,
  FactoryProvider,
  ForwardReference,
  Logger,
  Module,
  OnApplicationBootstrap,
  Type,
  ValueProvider,
} from '@nestjs/common';
import { Connection } from './common/interfaces/connection.interface';
import {
  isRoutedQueueAdapterOptions,
  isTopicQueueAdapterOptions,
  RabbitMQModuleAsyncOptions,
  RabbitMQModuleOptions,
} from './common/interfaces/rabbitmq.module-options';
import { DuplicatedConnectionAliasException } from './common/exceptions/duplicated-connection-alias.exception';
import {
  DEFAULT_CONNECTION_NAME,
  EXCEPTION_HANDLER_INJECTION_TOKEN,
} from './common/constants';
import { buildConnectionToken } from './core/utils/build-connection-token';
import { ConnectionWrapper } from './core/wrappers/connection.wrapper';
import { BaseExceptionHandler } from './core/base-exception-handler';
import { Connections } from './core/connections';
import {
  ListenerQueueManager,
  PubSubQueueManager,
  QueueManagers,
  RoutingQueueManager,
  RpcQueueManager,
  TopicsQueueManager,
  WorkerQueueManager,
} from './core/managers';
import { QueueHandlerExplorer } from './core/queue-handler-explorer';
import { QueueAdapterType } from './common/interfaces/queue-adapter-type.enum';
import {
  ListenerQueueAdapter,
  PubSubQueueAdapter,
  RoutingQueueAdapter,
  RpcQueueAdapter,
  TopicsQueueAdapter,
  WorkerQueueAdapter,
} from './core/adapter';
import { QueueAdapter } from './common/interfaces/queue-adapter.interface';

@Module({})
export class RabbitMQModule implements OnApplicationBootstrap {
  public constructor(
    private readonly connections: Connections,
    private readonly queueHandlerExplorer: QueueHandlerExplorer,
    private readonly listenerQueueManager: ListenerQueueManager,
    private readonly pubSubQueueManager: PubSubQueueManager,
    private readonly routingQueueManager: RoutingQueueManager,
    private readonly rpcQueueManager: RpcQueueManager,
    private readonly topicsQueueManager: TopicsQueueManager,
    private readonly workerQueueManager: WorkerQueueManager,
  ) {}

  public onApplicationBootstrap(): void {
    const { listener, pubSub, routing, rpc, topics, worker } =
      this.queueHandlerExplorer.explore();

    this.listenerQueueManager.register(listener);
    this.pubSubQueueManager.register(pubSub);
    this.routingQueueManager.register(routing);
    this.rpcQueueManager.register(rpc);
    this.topicsQueueManager.register(topics);
    this.workerQueueManager.register(worker);

    this.connectAndApply(true);
  }

  public async applyQueueManagers(): Promise<void> {
    await Promise.all([
      this.listenerQueueManager.apply(),
      this.pubSubQueueManager.apply(),
      this.routingQueueManager.apply(),
      this.rpcQueueManager.apply(),
      this.topicsQueueManager.apply(),
      this.workerQueueManager.apply(),
    ]);
  }

  public connect(applyQueueManagers?: boolean): void {
    this.connectAndApply(false, applyQueueManagers);
  }

  private connectAndApply(
    autoConnect: boolean,
    applyQueueManagers?: boolean,
  ): void {
    this.connections
      .connect(autoConnect)
      .then(async () => {
        if (applyQueueManagers ?? true) {
          await this.applyQueueManagers();
        }
      })
      .catch((e) => Logger.error(e.message, RabbitMQModule.name));
  }

  public static forRoot(options: RabbitMQModuleOptions): DynamicModule {
    return this.assemble(
      options.exceptionHandler,
      (Array.isArray(options.connection)
        ? options.connection
        : [{ name: DEFAULT_CONNECTION_NAME, ...options.connection }]
      ).map(
        (option): ValueProvider => ({
          provide: buildConnectionToken(option.name),
          useValue: new ConnectionWrapper(option),
        }),
      ),
      options.adapters,
    );
  }

  public static forRootAsync(
    options: RabbitMQModuleAsyncOptions,
  ): DynamicModule {
    const imports = new Set<
      DynamicModule | Promise<DynamicModule> | Type | ForwardReference
    >();

    const names = [] as string[];

    return this.assemble(
      options.exceptionHandler,
      (Array.isArray(options.connection)
        ? options.connection
        : [{ name: DEFAULT_CONNECTION_NAME, ...options.connection }]
      ).map((option) => {
        (option.imports ?? []).forEach((ref) => {
          imports.add(ref);
        });

        if (names.includes(option.name)) {
          throw new DuplicatedConnectionAliasException(option.name);
        }

        return {
          provide: buildConnectionToken(option.name),
          useFactory: async (...args: any[]): Promise<ConnectionWrapper> =>
            new ConnectionWrapper({
              ...(await option.useFactory(...args)),
              name: option.name,
            }),
          inject: option.inject,
        };
      }),
      options.adapters,
      [...imports],
    );
  }

  private static assemble(
    exceptionHandler: Type | undefined,
    connections: (FactoryProvider | ValueProvider)[],
    adapters?: RabbitMQModuleOptions['adapters'],
    imports?: DynamicModule['imports'],
  ): DynamicModule {
    const dynModule: DynamicModule = {
      module: RabbitMQModule,
      global: true,
      imports,
      providers: [
        RabbitMQModule,
        QueueHandlerExplorer,
        exceptionHandler
          ? {
              provide: EXCEPTION_HANDLER_INJECTION_TOKEN,
              useExisting: exceptionHandler,
            }
          : {
              provide: EXCEPTION_HANDLER_INJECTION_TOKEN,
              useValue: new BaseExceptionHandler(),
            },
        ...QueueManagers,
        ...connections,
      ],
      exports: [RabbitMQModule, ...connections],
    };

    dynModule.providers?.push({
      provide: Connections,
      useFactory: (...connections: Connection[]) =>
        new Connections(connections),
      inject: connections.map(({ provide }) => provide),
    });

    this.assembleAdapterProviders(dynModule, adapters);

    return dynModule;
  }

  private static assembleAdapterProviders(
    dynModule: DynamicModule,
    adapters: RabbitMQModuleOptions['adapters'],
  ): void {
    const adapterProviders = (adapters ?? []).map(
      (option): FactoryProvider => ({
        provide: option.name,
        useFactory: (connections: Connections) => {
          const assemble = <T extends QueueAdapter | RpcQueueAdapter>(
            adapter: Type<T>,
            ...args: any[]
          ): T =>
            new adapter(
              connections.get(option.connection ?? DEFAULT_CONNECTION_NAME),
              option.queue,
              ...args,
            );

          if (isRoutedQueueAdapterOptions(option)) {
            return assemble(RoutingQueueAdapter, option.route);
          } else if (isTopicQueueAdapterOptions(option)) {
            return assemble(TopicsQueueAdapter, option.pattern);
          } else {
            switch (option.type) {
              case QueueAdapterType.Listener:
                return assemble(ListenerQueueAdapter);
              case QueueAdapterType.Worker:
                return assemble(WorkerQueueAdapter);
              case QueueAdapterType.PubSub:
                return assemble(PubSubQueueAdapter);
              case QueueAdapterType.Rpc:
                return assemble<RpcQueueAdapter>(RpcQueueAdapter);
            }
          }
        },
      }),
    );

    if (adapterProviders.length > 0) {
      dynModule.providers?.push(...adapterProviders);
      dynModule.exports?.push(
        ...adapterProviders.map(({ provide }) => provide),
      );
    }
  }
}
