import { buildConnectionToken, snake } from '../../lib/common/constants';

describe('snake_case', (): void => {
  it('passing an empty string will do nothing', (): void => {
    expect(snake('')).toBe('');
  });

  it('first alphabetic character is lowercase', (): void => {
    const text = snake('ExampleString');

    expect(text.charAt(0)).toBe('e');
    expect(text).toBe('example_string');
  });

  it('first character is never an underscore', (): void => {
    expect(snake('     ExampleString')).toBe('example_string');
  });

  it('space will be replaced with an underscore', (): void => {
    expect(snake('Example String')).toBe('example__string');
  });

  it('name of the connection token is lowercase', (): void => {
    expect(buildConnectionToken('FallbackService')).toBe(
      'rmq.connection.fallback_service',
    );
  });
});
