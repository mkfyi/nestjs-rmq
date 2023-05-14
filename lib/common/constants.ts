export const METADATA_KEY_CONNECTION_TOKENS = 'rmq.meta.connection_tokens';

export const snake = (input: string): string =>
  input
    .replace(/([A-Z])/g, (match, group) => `_${group.toLowerCase()}`)
    .replace(/ /g, '_')
    .replace(/^_+/, '');

export const buildConnectionToken = (name: string): string =>
  `rmq.connection.${snake(name)}`;
