import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Config, Effect } from 'effect';
import { AppModule } from './app.module';
import { makeServerProgram, waitForShutdown } from './server';

const program = Effect.gen(function* () {
  const port = yield* Config.port('PORT').pipe(Config.withDefault(3000));

  yield* makeServerProgram({
    createApp: () => NestFactory.create<NestExpressApplication>(AppModule),
    port,
    shutdown: waitForShutdown(),
  });
});

void Effect.runPromise(program);
