# Agent Guidelines for nest-effect

## Commands

- Build: `npm run build` or `pnpm run build`
- Lint: `npm run lint` (auto-fixes issues)
- Format: `npm run format`
- Test: `npm test` (unit), `npm run test:e2e` (e2e), `npm run test:watch` (watch mode)
- Single test: `npm test -- path/to/test.spec.ts`

## Code Style

- Use single quotes, trailing commas (Prettier config)
- TypeScript strict mode - no `any` (ESLint enforced)
- Import order: NestJS decorators → services → types → Effect imports

## NestJS + Effect Patterns

- Return `Effect.Effect<T, E>` from controllers/services, not Promise
- Use Effect Schema for validation: `Schema.Struct`, `Schema.Class` for DTOs
- Error types explicit: `Effect.Effect<Cat, Error>` or `Effect.Effect<string, ParseError>`
- Use `Effect.gen()` for complex flows, `Effect.succeed()` for simple values
- Schema types: export both TS type and Schema - see `cat.type.ts:8,11`

## Naming & Structure

- Controllers: `*.controller.ts`, Services: `*.service.ts`, DTOs: `*.dto.ts`
- Types: `*.type.ts` with both Schema and TypeScript type exports
- Use PascalCase for classes/schemas, camelCase for variables/functions
