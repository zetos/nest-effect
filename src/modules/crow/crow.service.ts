import { Injectable } from '@nestjs/common';
import { Crow, Sleep } from './crow.type';
import { Effect } from 'effect';
import { fib, fibE, fibP, sleep } from '../../helper';

@Injectable()
export class CrowService {
  getFib(): Effect.Effect<Crow> {
    const fib44 = fib(44);
    console.log('getFib about to return');
    return Effect.succeed({ number: fib44 });
  }

  getFibP(): Effect.Effect<Crow> {
    const result = Effect.promise(() =>
      fibP(44).then((number) => ({ number })),
    );
    console.log('getFibP about to return');
    return result;
  }

  getFibE(): Effect.Effect<Crow> {
    const result = fibE(44).pipe(Effect.map((number) => ({ number })));
    console.log('getFibE about to return');
    return result;
  }

  getSleep(): Effect.Effect<Sleep> {
    const result = Effect.promise(() =>
      sleep(5000).then(() => ({ sleep: true as const })),
    );
    console.log('getSleep about to return');
    return result;
  }

  getSleepEffect(): Effect.Effect<Sleep> {
    const result = Effect.sleep('5 seconds').pipe(
      Effect.map(() => ({ sleep: true as const })),
    );
    console.log('getSleepEffect about to return');
    return result;
  }
}
