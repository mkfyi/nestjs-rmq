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
      [...imports],
    );
  }

  private static assemble(
    exceptionHandler: Type | undefined,
    connections: (FactoryProvider | ValueProvider)[],
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
              useClass: BaseExceptionHandler,
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

    return dynModule;
  }
}
