import { request } from 'pactum';

beforeAll(() => {
  request.setBaseUrl('http://localhost:3000');
});
