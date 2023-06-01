<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

[nest]: https://nestjs.com
[rabbitmq]: https://rabbitmq.com

<p align="center">A decent module for a more advanced communication between microservices.</p>
<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
</p>

## Description

This package provides a more advanced communication between microservices using the full power of [RabbitMQ][rabbitmq].

## Core library features

- Separate server/client components
- Allowing multiple connections to one or more RabbitMQ server
- Just implement the `QueueHandler` implement and mark the class with one of the following decorators
    1. `@Listener()` - [Basic consumer](https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html), the simplest thing that does *something*
    2. `@Worker()` - [Work Queues](https://www.rabbitmq.com/tutorials/tutorial-two-javascript.html), distributing tasks among workers
    3. `@PubSub()` - [Publish/Subscribe](https://www.rabbitmq.com/tutorials/tutorial-three-javascript.html), sending messages to many consumers at once
    4. `@Routing()` - [Routing](https://www.rabbitmq.com/tutorials/tutorial-four-javascript.html), receiving messages selectively
    5. `@Topics()` - [Topics](https://www.rabbitmq.com/tutorials/tutorial-five-javascript.html), receiving messages based on a pattern
    6. `@Rpc()` - [RPC](https://www.rabbitmq.com/tutorials/tutorial-six-javascript.html), Request/reply pattern
- Optional validation of message content using [class-validator](https://www.npmjs.com/package/class-validator)
- Lightweight wrapper of the `amqplib` for the [Nest][nest] ecosystem

## Installation

`nest-rmq` must be integrated into the ecosystem of [Nest][nest], so your application **must** require `@nestjs/common` and `@nestjs/core`. You can replace all `npm` commands with the package manager of your choice. So if you would like to use `yarn`, replace `npm` with `yarn`.

```bash
# from official npm registry
$ npm i --save @mkfyi/nestjs-rmq

# using yarn
$ yarn add @mkfyi/nestjs-rmq

# from GitHub package registry
$ npm i --save --registry=https://npm.pkg.github.com @mkfyi/nestjs-rmq

# from GitHub package registry using yarn
$ yarn add --registry=https://npm.pkg.github.com @mkfyi/nestjs-rmq
```

Since `nest-rmq` is built on top of [amqplib](https://www.npmjs.com/package/amqplib) you also need to install the types for it.

```bash
$ npm install -D @types/amqplib
```

### Usage

Import the `RabbitMQModule` from `@mkfyi/nestjs-rmq` and call the `forRoot()` method inside the imports of your application module. You can also set a custom `name` for the connection, otherwise `default` will be used.

#### Initialization

```TypeScript
import { RabbitMQModule } from '@mkfyi/nestjs-rmq';

@Module({
  imports: [
    // ...
    RabbitMQModule.forRoot({
      connection: {
        hostname: '',
        username: '',
        password: '',
      },
    }),
  ],
})
export class AppModule {}
```

If you prefer to use environment variables, consider adding the `@nestjs/config` and use `forRootAsync()` method instead.

```TypeScript
@Module({
  imports: [
    // ...
    RabbitMQModule.forRootAsync({
      connection: {
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          hostname: config.get('AMQP_HOSTNAME'),
          username: config.get('AMQP_USERNAME'),
          password: config.get('AMQP_PASSWORD'),
        }),
        inject: [ConfigService],
      },
    }),
  ],
})
export class AppModule {}
```

##### Multiple connections

You can also create multiple connections, just pass the object as above into an array and add the `name` property. This `name` is being used for the `QueueHandler` and `QueueAdapter`.

```TypeScript
@Module({
  imports: [
    // ...
    RabbitMQModule.forRootAsync({
      connection: [
        {
          name: 'default',
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            hostname: config.get('AMQP_HOSTNAME'),
            username: config.get('AMQP_USERNAME'),
            password: config.get('AMQP_PASSWORD'),
          }),
          inject: [ConfigService],
        },
        {
          name: 'stage',
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            hostname: config.get('AMQP_STAGE_HOSTNAME'),
            username: config.get('AMQP_STAGE_USERNAME'),
            password: config.get('AMQP_STAGE_PASSWORD'),
          }),
          inject: [ConfigService],
        }
      ],
    }),
  ],
})
export class AppModule {}
```

##### Adapters (client)

You have to configure the `adapters` properts in order send messages to the respective queue.

```TypeScript
@Module({
  imports: [
    // ...
    RabbitMQModule.forRootAsync({
      connection: {
        name: 'default',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          hostname: config.get('AMQP_HOSTNAME'),
          username: config.get('AMQP_USERNAME'),
          password: config.get('AMQP_PASSWORD'),
        }),
        inject: [ConfigService],
      },
      adapters: [
        {
          name: 'BACKEND_SERVICE',
          queue: 'example.worker,
          type: QueueAdapterType.Worker,
          connection: 'default',
        },
      ],
    }),
  ],
})
export class AppModule {}
```

The example shown above creates an adapter named `BACKEND_SERVICE` for the `default` connection. The value of the `name` property can be injected as `QueueAdapter` using `@Inject()`. You may want to change to `RpcQueueAdapter` for this type.

```TypeScript
@Injectable()
export class MyService {
  public constructor(
    @Inject('BACKEND_SERVICE')
    private readonly worker: QueueAdapter,
  ) {}

  public notifyUsernameUpdate(id: string, name: string) {
    return this.worker.send({ id, name });
  }
}
```

##### Handlers (server)

Every custom queue handler has to implement the `QueueHandler` interface. As for the adapters, there is a separate interface for RPC based handlers called `RpcQueueHandler`.

```TypeScript
@Worker({ queue: 'example.worker' })
export class ExampleWorkerQueueHandler implements QueueHandler {
  public async execute(msg: Message): Promise<void> {
    console.log(msg.object());
  }
}
```

Don't forget to add your queue handlers to the application module providers.

```TypeScript
@Module({
  imports: [
    // ...
    RabbitMQModule.forRootAsync({
      // ...
    }),
  ],
  providers: [
    // ...
    ExampleWorkerQueueHandler,
  ],
})
export class AppModule {}
```

## License

[nest-rmq](https://github.com/mkfyi/nestjs-rmq) is [MIT licensed](LICENSE).
