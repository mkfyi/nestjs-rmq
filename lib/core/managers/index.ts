import { ListenerQueueManager } from './listener.queue-manager';
import { WorkerQueueManager } from './worker.queue-manager';
import { PubSubQueueManager } from './pub-sub.queue-manager';
import { RoutingQueueManager } from './routing.queue-manager';
import { RpcQueueManager } from './rpc.queue-manager';
import { TopicsQueueManager } from './topics.queue-manager';

export const QueueManagers = [
  ListenerQueueManager,
  PubSubQueueManager,
  RoutingQueueManager,
  RpcQueueManager,
  TopicsQueueManager,
  WorkerQueueManager,
];

export {
  ListenerQueueManager,
  PubSubQueueManager,
  RoutingQueueManager,
  RpcQueueManager,
  TopicsQueueManager,
  WorkerQueueManager,
};
