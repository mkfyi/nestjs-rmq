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
import { QueueManagers } from './core/managers';

@Module({})
export class RabbitMQModule implements OnApplicationBootstrap {
  public constructor(private readonly connections: Connections) {}

  public onApplicationBootstrap(): void {
    this.connections
      .connect(true)
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
      exports: connections,
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
