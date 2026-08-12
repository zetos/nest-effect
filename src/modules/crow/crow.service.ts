import { Injectable } from '@nestjs/common';
import { Crow, Sleep } from './crow.type';
import { Effect } from 'effect';
import { fib, fibE, fibP, sleep } from '../../helper';

@Injectable()
export class CrowService {
  getFib(): Effect.Effect<Crow> {
    return Effect.sync(() => ({ number: fib(44) }));
  }

  getFibP(): Effect.Effect<Crow> {
    return Effect.promise(() => fibP(44).then((number) => ({ number })));
  }

  getFibE(): Effect.Effect<Crow> {
    return fibE(44).pipe(Effect.map((number) => ({ number })));
  }

  getSleep(): Effect.Effect<Sleep> {
    return Effect.promise(() =>
      sleep(5000).then(() => ({ sleep: true as const })),
    );
  }

  getSleepEffect(): Effect.Effect<Sleep> {
    return Effect.sleep('5 seconds').pipe(
      Effect.map(() => ({ sleep: true as const })),
    );
  }
}
