export interface QueueHandlerMetadata {
  queue: string;
  connection?: string;
}

export interface RoutedQueueHandlerMetadata extends QueueHandlerMetadata {
  keys: string[];
}

export interface TopicQueueHandlerMetadata extends QueueHandlerMetadata {
  pattern: string[];
}
