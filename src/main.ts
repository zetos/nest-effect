import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NodeRuntime } from '@effect/platform-node';
import { Config, Effect } from 'effect';
import { AppModule } from './app.module';
import { makeServerProgram } from './server';

const program = Effect.gen(function* () {
  const port = yield* Config.port('PORT').pipe(Config.withDefault(3000));

  return yield* makeServerProgram({
    createApp: () => NestFactory.create<NestExpressApplication>(AppModule),
    port,
  });
});

NodeRuntime.runMain(program);
