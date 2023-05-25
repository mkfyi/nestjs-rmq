export const snake = (input: string): string =>
  input
    .replace(/([A-Z])/g, (match, group) => `_${group.toLowerCase()}`)
    .replace(/ /g, '_')
    .replace(/^_+/, '');
