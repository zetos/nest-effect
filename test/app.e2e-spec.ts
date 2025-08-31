import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { spec } from 'pactum';
import { AppModule } from './../src/app.module';

describe('Cats API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(3000);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/cats (GET)', () => {
    it('should return empty array initially', async () => {
      await spec().get('/cats').expectStatus(200).expectJsonMatchStrict([]);
    });
  });

  describe('/cats (POST)', () => {
    it('should create a cat with valid data', async () => {
      await spec()
        .post('/cats')
        .withJson({ name: 'Fluffy' })
        .expectStatus(201)
        .expectBody('1');
    });

    it('should return validation error for invalid data', async () => {
      await spec()
        .post('/cats')
        .withJson({ invalidField: 'test' })
        .expectStatus(400);
    });

    it('should create a cat even with empty name (no validation on empty string)', async () => {
      await spec()
        .post('/cats')
        .withJson({ name: '' })
        .expectStatus(201)
        .expectBody('2');
    });
  });

  describe('/cats (GET) - after creating cats', () => {
    beforeAll(async () => {
      await spec().post('/cats').withJson({ name: 'Whiskers' });
      await spec().post('/cats').withJson({ name: 'Shadow' });
    });

    it('should return array of cats', async () => {
      await spec()
        .get('/cats')
        .expectStatus(200)
        .expectJsonMatchStrict([
          { id: '1', name: 'Fluffy' },
          { id: '2', name: '' },
          { id: '3', name: 'Whiskers' },
          { id: '4', name: 'Shadow' },
        ]);
    });
  });

  describe('/cats/:id (GET)', () => {
    it('should return a specific cat', async () => {
      await spec()
        .get('/cats/1')
        .expectStatus(200)
        .expectJsonMatchStrict({ id: '1', name: 'Fluffy' });
    });

    it('should return 404 for non-existent cat', async () => {
      await spec().get('/cats/999').expectStatus(404).expectJsonMatchStrict({
        message: 'Resource not found',
        error: 'Not Found',
        statusCode: 404,
      });
    });

    it('should return 404 for invalid id format', async () => {
      await spec()
        .get('/cats/invalid')
        .expectStatus(404)
        .expectJsonMatchStrict({
          message: 'Resource not found',
          error: 'Not Found',
          statusCode: 404,
        });
    });
  });
});
