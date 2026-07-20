import { Schema } from 'effect';

export const Cat = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export type Cat = typeof Cat.Type;
