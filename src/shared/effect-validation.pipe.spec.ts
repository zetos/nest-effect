import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { Schema } from 'effect';
import { EffectValidationPipe } from './effect-validation.pipe';

// NumberFromString demonstrates that decoding can transform input as well as
// validate it.
class RequestDto extends Schema.Class<RequestDto>('RequestDto')({
  count: Schema.NumberFromString,
  name: Schema.String,
}) {}

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: RequestDto,
};

describe('EffectValidationPipe', () => {
  const pipe = new EffectValidationPipe();

  it('decodes and transforms schema DTOs', () => {
    const result = pipe.transform({ count: '2', name: 'Milo' }, metadata);

    expect(result).toBeInstanceOf(RequestDto);
    expect(result).toMatchObject({ count: 2, name: 'Milo' });
  });

  it('returns all validation failures with their paths', () => {
    try {
      pipe.transform({ count: false }, metadata);
      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        message: 'Validation failed',
        errors: [{ path: ['count'] }, { path: ['name'] }],
      });
    }
  });

  it('passes through values without a schema metatype', () => {
    const value = { untouched: true };

    expect(pipe.transform(value, { type: 'body', metatype: Object })).toBe(
      value,
    );
  });
});
