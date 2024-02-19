import { Inject, Injectable } from '@nestjs/common';
import { ActionCallback, Json } from '../common/interfaces/json.interface';
import {
  JSON_SERVICE_PARSER,
  JSON_SERVICE_REPLACER,
} from '../common/constants';

@Injectable()
export class JsonService implements Json {
  public constructor(
    @Inject(JSON_SERVICE_PARSER) private readonly parser?: ActionCallback,
    @Inject(JSON_SERVICE_REPLACER) private readonly replacer?: ActionCallback,
  ) {}

  public stringify<T>(data: T, space?: number | string): string {
    return JSON.stringify(data, this.replacer, space);
  }

  public parse<T = unknown>(data: string): T {
    return JSON.parse(data, this.parser);
  }
}
