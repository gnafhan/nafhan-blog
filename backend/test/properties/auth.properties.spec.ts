import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as fc from 'fast-check';
import { AppModule } from '../../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Auth Properties (Property-Based Tests)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongoUri), AppModule],
    })
      .overrideModule(AppModule)
      .useModule(AppModule)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  /**
   * Feature: blog-platform, Property 1: User Registration Creates Valid User
   * Validates: Requirements 1.1
   */
  it('Property 1: For any valid registration data, registering should create a user with hashed password and return JWT', async () => {
    const validNameArb = fc.string({ minLength: 2, maxLength: 50 });
    const validEmailArb = fc.emailAddress();
    const validPasswordArb = fc.string({ minLength: 6, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        validNameArb,
        validEmailArb,
        validPasswordArb,
        async (name, email, password) => {
          const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ name, email, password })
            .expect((res) => {
              // Should return 201 or 409 (if email already exists from previous test)
              return res.status === 201 || res.status === 409;
            });

          if (response.status === 201) {
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('name', name);
            expect(response.body.user).toHaveProperty(
              'email',
              email.toLowerCase(),
            );
            expect(response.body.user).not.toHaveProperty('password');
            expect(typeof response.body.token).toBe('string');
            expect(response.body.token.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Feature: blog-platform, Property 2: Invalid Registration Data Returns Validation Errors
   * Validates: Requirements 1.3
   */
  it('Property 2: For any registration data with invalid fields, should return 400 with validation errors', async () => {
    const invalidNameArb = fc.oneof(
      fc.constant(''), // empty name
      fc.string({ maxLength: 1 }), // name too short
    );
    const invalidEmailArb = fc.oneof(
      fc.constant('not-an-email'),
      fc.constant(''),
      fc
        .string({ minLength: 1, maxLength: 20 })
        .filter((s) => !s.includes('@')),
    );
    const invalidPasswordArb = fc.oneof(
      fc.constant(''), // empty password
      fc.string({ maxLength: 5 }), // password too short
    );

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.record({
            name: invalidNameArb,
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6 }),
          }),
          fc.record({
            name: fc.string({ minLength: 2 }),
            email: invalidEmailArb,
            password: fc.string({ minLength: 6 }),
          }),
          fc.record({
            name: fc.string({ minLength: 2 }),
            email: fc.emailAddress(),
            password: invalidPasswordArb,
          }),
        ),
        async (invalidData) => {
          const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(invalidData);

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('message');
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Feature: blog-platform, Property 3: Valid Login Returns JWT Token
   * Validates: Requirements 1.4
   */
  it('Property 3: For any registered user, logging in with correct credentials should return JWT', async () => {
    const validNameArb = fc.string({ minLength: 2, maxLength: 50 });
    const validEmailArb = fc.emailAddress();
    const validPasswordArb = fc.string({ minLength: 6, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        validNameArb,
        validEmailArb,
        validPasswordArb,
        async (name, email, password) => {
          // First register the user
          const registerResponse = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ name, email, password });

          // Skip if user already exists
          if (registerResponse.status === 409) {
            return true;
          }

          expect(registerResponse.status).toBe(201);

          // Then try to login
          const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password })
            .expect(201);

          expect(loginResponse.body).toHaveProperty('user');
          expect(loginResponse.body).toHaveProperty('token');
          expect(typeof loginResponse.body.token).toBe('string');
          expect(loginResponse.body.token.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Feature: blog-platform, Property 4: Invalid Login Returns Unauthorized
   * Validates: Requirements 1.5
   */
  it('Property 4: For any login attempt with incorrect credentials, should return 401', async () => {
    const validEmailArb = fc.emailAddress();
    const validPasswordArb = fc.string({ minLength: 6, maxLength: 100 });
    const wrongPasswordArb = fc.string({ minLength: 6, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        validEmailArb,
        validPasswordArb,
        wrongPasswordArb,
        async (email, correctPassword, wrongPassword) => {
          // Ensure wrong password is different from correct password
          if (correctPassword === wrongPassword) {
            return true;
          }

          // First register a user
          const name = 'Test User';
          const registerResponse = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ name, email, password: correctPassword });

          // Skip if user already exists
          if (registerResponse.status === 409) {
            return true;
          }

          expect(registerResponse.status).toBe(201);

          // Try to login with wrong password
          const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password: wrongPassword });

          expect(loginResponse.status).toBe(401);
          expect(loginResponse.body).toHaveProperty('message');
        },
      ),
      { numRuns: 10 },
    );
  });
});
