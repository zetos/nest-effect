import { Schema } from 'effect';

export const Crow = Schema.Struct({
  number: Schema.Finite,
});

export type Crow = typeof Crow.Type;

export const Sleep = Schema.Struct({
  sleep: Schema.Literal(true),
});

export type Sleep = typeof Sleep.Type;
