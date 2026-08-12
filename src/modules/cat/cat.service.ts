import { Injectable, NotFoundException } from '@nestjs/common';
import { Effect, Schema } from 'effect';
import { Cat } from './cat.type';

@Injectable()
export class CatService {
  db: Map<string, Cat> = new Map(); // Simulate a external DB

  getCats(): Effect.Effect<Cat[]> {
    return Effect.sync(() => Array.from(this.db.values()));
  }

  createCat(name: string): Effect.Effect<string, Schema.SchemaError> {
    const db = this.db;

    return Effect.gen(function* () {
      const id = db.size + 1;

      const newCat = {
        id: id.toString(),
        name,
      };

      const cat = yield* Schema.decodeEffect(Cat)(newCat);

      db.set(cat.id, cat);

      return cat.id;
    });
  }

  getCat(id: string): Effect.Effect<Cat, NotFoundException> {
    return Effect.suspend(() =>
      Effect.fromNullishOr(this.db.get(id)).pipe(
        Effect.mapError(() => new NotFoundException('Resource not found')),
      ),
    );
  }
}
