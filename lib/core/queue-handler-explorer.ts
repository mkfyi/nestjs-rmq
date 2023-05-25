import 'reflect-metadata';
import { Injectable, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { HandlerOptions } from '../common/interfaces/handler-options.interface';
import {
  QueueHandler,
  RpcQueueHandler,
} from '../common/interfaces/queue-handler.interface';
import {
  LISTENER_HANDLER_METADATA,
  PUB_SUB_ANDLER_METADATA,
  ROUTING_HANDLER_METADATA,
  RPC_HANDLER_METADATA,
  TOPICS_HANDLER_METADATA,
  WORKER_HANDLER_METADATA,
} from '../common/constants';

@Injectable()
export class QueueHandlerExplorer {
  public constructor(private readonly modulesContainer: ModulesContainer) {}

  public explore(): HandlerOptions {
    const modules = [...this.modulesContainer.values()];

    const listener = this.flatMap<QueueHandler>(modules, (instance) => {
      return this.filterProvider(instance, LISTENER_HANDLER_METADATA);
    });

    const pubSub = this.flatMap<QueueHandler>(modules, (instance) => {
      return this.filterProvider(instance, PUB_SUB_ANDLER_METADATA);
    });

    const routing = this.flatMap<QueueHandler>(modules, (instance) => {
      return this.filterProvider(instance, ROUTING_HANDLER_METADATA);
    });

    const rpc = this.flatMap<RpcQueueHandler>(modules, (instance) => {
      return this.filterProvider(instance, RPC_HANDLER_METADATA);
    });

    const topics = this.flatMap<QueueHandler>(modules, (instance) => {
      return this.filterProvider(instance, TOPICS_HANDLER_METADATA);
    });

    const worker = this.flatMap<QueueHandler>(modules, (instance) => {
      return this.filterProvider(instance, WORKER_HANDLER_METADATA);
    });

    return { listener, pubSub, routing, rpc, topics, worker };
  }

  private flatMap<T>(
    modules: Module[],
    callback: (instance: InstanceWrapper) => Type | undefined,
  ): Type<T>[] {
    const items = modules
      .map((module) => [...module.providers.values()].map(callback))
      .reduce((a, b) => a.concat(b), []);
    return items.filter((element) => !!element) as Type<T>[];
  }

  private filterProvider(
    wrapper: InstanceWrapper,
    metadataKey: string,
  ): Type | undefined {
    return wrapper.instance
      ? this.extractMetadata(wrapper.instance, metadataKey)
      : undefined;
  }

  private extractMetadata<T extends Record<string, unknown>>(
    instance: T,
    metadataKey: string,
  ): Type | undefined {
    return instance.constructor &&
      Reflect.getMetadata(metadataKey, instance.constructor)
      ? (instance.constructor as Type)
      : undefined;
  }
}
