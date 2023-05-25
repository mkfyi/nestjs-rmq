export interface QueueAdapter<Ret = boolean> {
  send<T>(data: T): Promise<Ret>;
}
