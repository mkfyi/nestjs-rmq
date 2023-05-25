import { Injectable } from '@nestjs/common';
import { Connection } from '../common/interfaces/connection.interface';
import { snake } from './utils/snake-case';

@Injectable()
export class Connections {
  private readonly cache: ReadonlyMap<string, Connection>;

  public constructor(connections: Connection[]) {
    this.cache = new Map<string, Connection>(
      connections.map((connection) => [connection.name, connection]),
    );
  }

  public get(name: string): Connection | null {
    return this.cache.get(snake(name)) ?? null;
  }

  /**
   * @throws ConnectionFailedException
   */
  public async connect(autoConnect: boolean): Promise<void> {
    await Promise.all(
      [...this.cache.values()]
        .filter((connection) => connection.autoConnect === autoConnect)
        .map((connection) => connection.connect()),
    );
  }
}
