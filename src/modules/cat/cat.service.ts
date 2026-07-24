import { Injectable, NotFoundException } from '@nestjs/common';
import { Effect, Schema } from 'effect';
import { ParseError } from 'effect/ParseResult';
import { Cat } from './cat.type';

@Injectable()
export class CatService {
  db: Map<string, Cat> = new Map(); // Simulate a external DB

  getCats(): Effect.Effect<Cat[]> {
    const result = Effect.succeed(Array.from(this.db.values()));
    console.log('getCats about to return');
    return result;
  }

  createCat(name: string): Effect.Effect<string, ParseError> {
    // Explicit type of value and possible failure
    return Effect.gen(this, function* () {
      // Create a generator function to return an effect
      const id = this.db.size + 1;

      const newCat = {
        id: id.toString(),
        name,
      };

      const cat = yield* Schema.decode(Cat)(newCat); // decode the object by a Schema Cat and thow an error if fail

      this.db.set(cat.id, cat);

      console.log('createCat about to return');
      return cat.id;
    });
  }

  getCat(id: string): Effect.Effect<Cat, NotFoundException> {
    return Effect.suspend(() =>
      Effect.fromNullable(this.db.get(id)).pipe(
        Effect.mapError(() => new NotFoundException('Resource not found')),
      ),
    );
  }
}
