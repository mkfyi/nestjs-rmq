import {
  DynamicModule,
  FactoryProvider,
  Module,
  OnApplicationBootstrap,
  ValueProvider,
} from '@nestjs/common';
import {
  RabbitMQModuleAsyncOptions,
  RabbitMQModuleOptions,
} from './common/interfaces/rabbitmq.module-options';

@Module({})
export class RabbitMQModule implements OnApplicationBootstrap {
  public onApplicationBootstrap(): void {}

  public static forRoot(options: RabbitMQModuleOptions): DynamicModule {
    // @todo: map options.connection and create instances for ValueProvider
    return this.assemble([]);
  }

  public static forRootAsync(
    options: RabbitMQModuleAsyncOptions,
  ): DynamicModule {
    // @todo: map options.connection and create factories for FactoryProvider
    return this.assemble([]);
  }

  private static assemble(
    providers: (FactoryProvider | ValueProvider)[],
    imports?: DynamicModule['imports'],
  ): DynamicModule {
    return {
      module: RabbitMQModule,
      global: true,
      imports,
      providers,
      exports: providers,
    } satisfies DynamicModule;
  }
}
