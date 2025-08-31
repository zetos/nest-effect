import { Schema } from 'effect';

// Use a Class Schema to enjoy 100% of nest decorator features
export class CatDto extends Schema.Class<CatDto>('CatDto')({
  name: Schema.String,
}) {}
