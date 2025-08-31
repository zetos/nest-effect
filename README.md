# NestJS + Effect Integration PoC

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
  <span style="font-size: 2em; margin: 0 20px;">+</span>
  <a href="https://effect.website/" target="blank"><img src="https://effect.website/images/logos/effect-logo.svg" width="120" alt="Effect Logo" /></a>
</p>

<p align="center">
  A proof-of-concept integration of <strong>Effect</strong> (functional programming library) with <strong>NestJS</strong> framework.
</p>

## Description

This project demonstrates how to integrate [Effect](https://effect.website/) - a powerful TypeScript library for functional programming - with the [NestJS](https://nestjs.com/) framework. It showcases:

- **Effect Schema validation** using a custom validation pipe
- **Effect execution** through a custom interceptor
- **Type-safe error handling** with automatic HTTP status code mapping
- **Functional programming patterns** in a NestJS application

### Key Features

- 🔧 **Custom EffectValidationPipe** - Validates incoming requests using Effect Schema
- 🚀 **Custom EffectInterceptor** - Automatically executes Effect computations and handles errors
- 📝 **Rich Error Messages** - Detailed validation errors with field context
- 🎯 **Type Safety** - Full TypeScript support with proper Effect types
- 🔄 **Seamless Integration** - Works alongside regular NestJS controllers and services

### Project Structure

```
src/
├── modules/cat/           # Example module demonstrating Effect usage
│   ├── cat.controller.ts  # Controller returning Effect computations
│   ├── cat.service.ts     # Service using Effect for operations
│   ├── cat.dto.ts         # Effect Schema-based DTOs
│   └── cat.type.ts        # Effect Schema type definitions
└── shared/                # Effect integration components
    ├── effect.interceptor.ts       # Executes Effects and handles errors
    └── effect-validation.pipe.ts   # Validates using Effect Schema
```

### How It Works

1. **Request Validation**: The `EffectValidationPipe` validates incoming requests using Effect Schema, providing detailed error messages for invalid data.

2. **Effect Execution**: Controllers return `Effect.Effect<T>` computations instead of direct values.

3. **Automatic Processing**: The `EffectInterceptor` automatically detects Effect return values, executes them, and converts errors to appropriate HTTP responses.

4. **Error Handling**: Effect errors are automatically mapped to proper HTTP status codes (400 for validation errors, 404 for not found, etc.).

## Example Usage

```typescript
// DTO with Effect Schema validation
export class CatDto extends Schema.Class<CatDto>('CatDto')({
  name: Schema.String,
}) {}

// Controller returning Effect computations
@Controller('cats')
export class CatController {
  @Post()
  createCat(@Body() catDto: CatDto): Effect.Effect<string, ParseError> {
    return this.catService.createCat(catDto.name);
  }

  @Get(':id')
  getCat(@Param('id') id: string): Effect.Effect<Cat, Error> {
    return this.catService.getCat(id);
  }
}
```

The interceptor automatically handles the Effect execution and error mapping:

- ✅ Validation errors → 400 Bad Request
- ✅ Not found errors → 404 Not Found
- ✅ Other errors → 500 Internal Server Error

## Project Setup

```bash
$ pnpm install
```

## Compile and Run the Project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## API Endpoints

- `GET /cats` - Get all cats
- `POST /cats` - Create a new cat (requires `name` in body)
- `GET /cats/:id` - Get a specific cat by ID

## Run Tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Key Components

### EffectValidationPipe

Validates incoming requests using Effect Schema:

```typescript
@Injectable()
export class EffectValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Validates using Effect Schema and provides detailed error messages
  }
}
```

### EffectInterceptor

Automatically executes Effect computations and handles errors:

```typescript
@Injectable()
export class EffectInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Detects Effect return values and executes them
    // Maps Effect errors to appropriate HTTP responses
  }
}
```

## Benefits of This Integration

- **🔍 Better Error Handling**: Rich validation errors with field context
- **🎯 Type Safety**: Full TypeScript support with Effect types
- **🚀 Performance**: Optimized execution path for both Effects and regular values
- **🔧 Maintainability**: Clean separation of concerns with reusable components
- **📚 Functional Programming**: Leverage Effect's powerful functional programming patterns

## Resources

### NestJS

- [NestJS Documentation](https://docs.nestjs.com)
- [NestJS Discord](https://discord.gg/G7Qnnhy)

### Effect

- [Effect Documentation](https://effect.website/docs)
- [Effect GitHub](https://github.com/Effect-TS/effect)
- [Effect Discord](https://discord.gg/effect-ts)

## Contributing

This is a proof-of-concept project. Feel free to fork and experiment with different integration approaches!

## License

This project is [MIT licensed](LICENSE).
