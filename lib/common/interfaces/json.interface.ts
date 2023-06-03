export interface Json {
  stringify<T>(data: T, space?: number | string): string;
  parse<T = unknown>(data: string): T;
}

export type ActionCallback = (key: string, value: any) => any;
