import { Schema } from 'effect';

const _Cat = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export type Cat = Schema.Schema.Type<typeof _Cat>; // TS type can be use exactly same as before
// export interface Cat extends Schema.Schema.Type<typeof _Cat> {} // TS type can be use exactly same as before

export const Cat: Schema.Schema<Cat> = _Cat; // Schema type that will be use for decoding
