// noinspection ES6PreferShortImport
import { Channel } from './amqp-wrapper.interfaces';

export interface Connection {
  /**
   * The name of the connection during module setup. If only one connection is
   * given without passing a name, "default" will be used.
   */
  name: string;

  /**
   * Determines if the connection has been established.
   */
  connected: boolean;

  /**
   * Determines if the connection will be established during
   * onApplicationBootstrap() lifecycle (default: true).
   */
  autoConnect: boolean;

  /**
   * Connects to an AMQP server.
   *
   * @throws ConnectionFailedException
   */
  connect(): Promise<void>;

  /**
   * Closes the open connection to an AMQP server.
   */
  close(): Promise<void>;

  /**
   * Creates a channel for this specific connection.
   *
   * @throws NotConnectedException
   */
  channel(): Promise<Channel>;
}
