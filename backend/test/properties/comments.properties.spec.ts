import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as fc from 'fast-check';
import { AppModule } from '../../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Comments Properties (Property-Based Tests)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  // Safe email generator to avoid special characters that may cause validation issues
  const safeEmailArb = fc
    .tuple(
      fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
      fc.stringMatching(/^[a-z]{3,8}$/),
      fc.constantFrom('com', 'org', 'net', 'io'),
    )
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

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
   * Feature: blog-platform, Property 13: Comment Creation Associates with Post and Author
   * Validates: Requirements 4.1
   */
  it('Property 13: For any valid comment, creating it should associate with post and author', async () => {
    // Use safe alphanumeric strings to avoid HTTP parsing issues with special characters
    const validContentArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((s) => {
        const trimmed = s.trim();
        // Only allow printable ASCII characters and common punctuation
        return trimmed.length > 0 && /^[\x20-\x7E]+$/.test(trimmed);
      });

    await fc.assert(
      fc.asyncProperty(validContentArb, safeEmailArb, async (content, userEmail) => {
        // Create a user and get token
        const registerResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'Test User',
            email: userEmail,
            password: 'password123',
          });

        // Handle case where user already exists
        let token: string;
        let userId: string;
        if (registerResponse.status === 201) {
          token = registerResponse.body.token;
          userId = registerResponse.body.user._id || registerResponse.body.user.id;
        } else if (registerResponse.status === 409) {
          const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userEmail, password: 'password123' })
            .expect(201);
          token = loginResponse.body.token;
          userId = loginResponse.body.user._id || loginResponse.body.user.id;
        } else {
          throw new Error(`Unexpected status: ${registerResponse.status}`);
        }

        // Create a post
        const postResponse = await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'Test Post',
            content: 'Test content',
          })
          .expect(201);

        const postId = postResponse.body._id;

        // Create a comment
        const commentResponse = await request(app.getHttpServer())
          .post(`/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${token}`)
          .send({ content })
          .expect(201);

        expect(commentResponse.body).toHaveProperty('content', content.trim());
        expect(commentResponse.body).toHaveProperty('post', postId);
        // Author is populated as an object with _id, name, email
        expect(commentResponse.body).toHaveProperty('author');
        expect(commentResponse.body.author._id || commentResponse.body.author).toBe(userId);
        expect(commentResponse.body).toHaveProperty('createdAt');
        expect(commentResponse.body).toHaveProperty('updatedAt');
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: blog-platform, Property 14: Comment Listing Returns All Comments
   * Validates: Requirements 4.3
   */
  it('Property 14: For any post with N comments, requesting comments should return exactly N comments', async () => {
    const numCommentsArb = fc.integer({ min: 0, max: 5 });

    await fc.assert(
      fc.asyncProperty(numCommentsArb, safeEmailArb, async (numComments, userEmail) => {
        // Create a user and get token
        const registerResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'Test User',
            email: userEmail,
            password: 'password123',
          });

        // Handle case where user already exists
        let token: string;
        if (registerResponse.status === 201) {
          token = registerResponse.body.token;
        } else if (registerResponse.status === 409) {
          const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userEmail, password: 'password123' })
            .expect(201);
          token = loginResponse.body.token;
        } else {
          throw new Error(`Unexpected status: ${registerResponse.status}`);
        }

        // Create a post
        const postResponse = await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'Test Post',
            content: 'Test content',
          })
          .expect(201);

        const postId = postResponse.body._id;

        // Create N comments
        for (let i = 0; i < numComments; i++) {
          await request(app.getHttpServer())
            .post(`/posts/${postId}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: `Comment ${i}` })
            .expect(201);
        }

        // Get all comments
        const commentsResponse = await request(app.getHttpServer())
          .get(`/posts/${postId}/comments`)
          .expect(200);

        expect(Array.isArray(commentsResponse.body)).toBe(true);
        expect(commentsResponse.body.length).toBe(numComments);

        // Verify each comment has required fields
        commentsResponse.body.forEach((comment: any) => {
          expect(comment).toHaveProperty('content');
          expect(comment).toHaveProperty('author');
          expect(comment.author).toHaveProperty('name');
          expect(comment.author).toHaveProperty('email');
          expect(comment).toHaveProperty('createdAt');
          expect(comment).toHaveProperty('updatedAt');
        });
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: blog-platform, Property 15: Comment Update Applies Changes for Author
   * Validates: Requirements 4.4
   */
  it('Property 15: For any comment and valid update data by author, comment should be updated', async () => {
    // Use safe strings - only alphanumeric, spaces, and basic punctuation (no periods)
    const safeChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,!?-';
    const safeStringArb = fc
      .array(fc.constantFrom(...safeChars.split('')), { minLength: 1, maxLength: 100 })
      .map((chars) => chars.join(''))
      .filter((s) => s.trim().length > 0);
    const validContentArb = safeStringArb;
    const updatedContentArb = safeStringArb;

    await fc.assert(
      fc.asyncProperty(
        validContentArb,
        updatedContentArb,
        safeEmailArb,
        async (originalContent, updatedContent, userEmail) => {
          // Create a user and get token
          const registerResponse = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
              name: 'Test User',
              email: userEmail,
              password: 'password123',
            });

          // Handle case where user already exists
          let token: string;
          if (registerResponse.status === 201) {
            token = registerResponse.body.token;
          } else if (registerResponse.status === 409) {
            const loginResponse = await request(app.getHttpServer())
              .post('/auth/login')
              .send({ email: userEmail, password: 'password123' })
              .expect(201);
            token = loginResponse.body.token;
          } else {
            throw new Error(`Unexpected status: ${registerResponse.status}`);
          }

          // Create a post
          const postResponse = await request(app.getHttpServer())
            .post('/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({
              title: 'Test Post',
              content: 'Test content',
            })
            .expect(201);

          const postId = postResponse.body._id;

          // Create a comment
          const commentResponse = await request(app.getHttpServer())
            .post(`/posts/${postId}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: originalContent })
            .expect(201);

          const commentId = commentResponse.body._id;
          const originalUpdatedAt = commentResponse.body.updatedAt;

          // Update the comment
          const updateResponse = await request(app.getHttpServer())
            .put(`/comments/${commentId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: updatedContent })
            .expect(200);

          expect(updateResponse.body).toHaveProperty(
            'content',
            updatedContent.trim(),
          );
          expect(updateResponse.body._id).toBe(commentId);
          expect(
            new Date(updateResponse.body.updatedAt).getTime(),
          ).toBeGreaterThanOrEqual(new Date(originalUpdatedAt).getTime());
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: blog-platform, Property 16: Comment Operations Require Author Authorization
   * Validates: Requirements 4.5, 4.7
   */
  it('Property 16: For any comment by user A, user B should not be able to update or delete it', async () => {
    // Use safe alphanumeric strings to avoid HTTP parsing issues with special characters
    const validContentArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((s) => {
        const trimmed = s.trim();
        // Only allow printable ASCII characters and common punctuation
        return trimmed.length > 0 && /^[\x20-\x7E]+$/.test(trimmed);
      });

    await fc.assert(
      fc.asyncProperty(validContentArb, safeEmailArb, safeEmailArb, async (content, userAEmail, userBEmail) => {
        // Skip if same email
        if (userAEmail === userBEmail) return true;

        // Create user A and get token
        const registerAResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'User A',
            email: userAEmail,
            password: 'password123',
          });

        // Handle case where user already exists
        let tokenA: string;
        if (registerAResponse.status === 201) {
          tokenA = registerAResponse.body.token;
        } else if (registerAResponse.status === 409) {
          const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userAEmail, password: 'password123' })
            .expect(201);
          tokenA = loginResponse.body.token;
        } else {
          throw new Error(`Unexpected status: ${registerAResponse.status}`);
        }

        // Create user B and get token
        const registerBResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'User B',
            email: userBEmail,
            password: 'password123',
          });

        // Handle case where user already exists
        let tokenB: string;
        if (registerBResponse.status === 201) {
          tokenB = registerBResponse.body.token;
        } else if (registerBResponse.status === 409) {
          const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userBEmail, password: 'password123' })
            .expect(201);
          tokenB = loginResponse.body.token;
        } else {
          throw new Error(`Unexpected status: ${registerBResponse.status}`);
        }

        // User A creates a post
        const postResponse = await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({
            title: 'Test Post',
            content: 'Test content',
          })
          .expect(201);

        const postId = postResponse.body._id;

        // User A creates a comment
        const commentResponse = await request(app.getHttpServer())
          .post(`/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ content })
          .expect(201);

        const commentId = commentResponse.body._id;

        // User B tries to update the comment - should fail
        const updateResponse = await request(app.getHttpServer())
          .put(`/comments/${commentId}`)
          .set('Authorization', `Bearer ${tokenB}`)
          .send({ content: 'Updated by B' });

        expect(updateResponse.status).toBe(403);
        expect(updateResponse.body).toHaveProperty('message');

        // User B tries to delete the comment - should fail
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/comments/${commentId}`)
          .set('Authorization', `Bearer ${tokenB}`);

        expect(deleteResponse.status).toBe(403);
        expect(deleteResponse.body).toHaveProperty('message');

        // Verify comment still exists
        const commentsResponse = await request(app.getHttpServer())
          .get(`/posts/${postId}/comments`)
          .expect(200);

        const commentStillExists = commentsResponse.body.some(
          (c: any) => c._id === commentId,
        );
        expect(commentStillExists).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
