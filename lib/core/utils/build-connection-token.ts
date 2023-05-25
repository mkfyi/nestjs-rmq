import { snake } from './snake-case';

export const buildConnectionToken = (name: string): string =>
  `rmq.connection.${snake(name)}`;
