import { Injectable } from '@nestjs/common';
import { Cat } from './cat.type';
import { Effect, Schema } from 'effect';
import { ParseError } from 'effect/ParseResult';

@Injectable()
export class CatService {
  db: Map<string, Cat> = new Map(); // Simulate a external DB

  getCats(): Effect.Effect<Cat[]> {
    return Effect.succeed(Array.from(this.db.values()));
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

      return cat.id;
    });
  }

  getCat(id: string): Effect.Effect<Cat, Error> {
    // New return type with Effect
    const cat = this.db.get(id);

    return Effect.fromNullable(cat); // Convert a nullable value in a Effect
  }
}
