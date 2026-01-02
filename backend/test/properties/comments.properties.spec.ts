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

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        AppModule,
      ],
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
    const validContentArb = fc.string({ minLength: 1, maxLength: 1000 })
      .filter(s => {
        const trimmed = s.trim();
        // Only allow printable ASCII characters and common punctuation
        return trimmed.length > 0 && /^[\x20-\x7E]+$/.test(trimmed);
      });

    await fc.assert(
      fc.asyncProperty(validContentArb, async (content) => {
        // Create a user and get token
        const userEmail = `user-${Date.now()}-${Math.random()}@example.com`;
        const registerResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'Test User',
            email: userEmail,
            password: 'password123',
          })
          .expect(201);

        const token = registerResponse.body.token;
        const userId = registerResponse.body.user._id || registerResponse.body.user.id;

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
        expect(commentResponse.body.author.toString()).toBe(userId);
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
      fc.asyncProperty(numCommentsArb, async (numComments) => {
        // Create a user and get token
        const userEmail = `user-${Date.now()}-${Math.random()}@example.com`;
        const registerResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'Test User',
            email: userEmail,
            password: 'password123',
          })
          .expect(201);

        const token = registerResponse.body.token;

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
    // Use safe alphanumeric strings to avoid HTTP parsing issues with special characters
    const safeStringArb = fc.string({ minLength: 1, maxLength: 1000 })
      .filter(s => {
        const trimmed = s.trim();
        // Only allow printable ASCII characters and common punctuation
        return trimmed.length > 0 && /^[\x20-\x7E]+$/.test(trimmed);
      });
    const validContentArb = safeStringArb;
    const updatedContentArb = safeStringArb;

    await fc.assert(
      fc.asyncProperty(validContentArb, updatedContentArb, async (originalContent, updatedContent) => {
        // Create a user and get token
        const userEmail = `user-${Date.now()}-${Math.random()}@example.com`;
        const registerResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'Test User',
            email: userEmail,
            password: 'password123',
          })
          .expect(201);

        const token = registerResponse.body.token;

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

        expect(updateResponse.body).toHaveProperty('content', updatedContent.trim());
        expect(updateResponse.body._id).toBe(commentId);
        expect(new Date(updateResponse.body.updatedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(originalUpdatedAt).getTime(),
        );
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: blog-platform, Property 16: Comment Operations Require Author Authorization
   * Validates: Requirements 4.5, 4.7
   */
  it('Property 16: For any comment by user A, user B should not be able to update or delete it', async () => {
    // Use safe alphanumeric strings to avoid HTTP parsing issues with special characters
    const validContentArb = fc.string({ minLength: 1, maxLength: 1000 })
      .filter(s => {
        const trimmed = s.trim();
        // Only allow printable ASCII characters and common punctuation
        return trimmed.length > 0 && /^[\x20-\x7E]+$/.test(trimmed);
      });

    await fc.assert(
      fc.asyncProperty(validContentArb, async (content) => {
        // Create user A and get token
        const userAEmail = `userA-${Date.now()}-${Math.random()}@example.com`;
        const registerAResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'User A',
            email: userAEmail,
            password: 'password123',
          })
          .expect(201);

        const tokenA = registerAResponse.body.token;

        // Create user B and get token
        const userBEmail = `userB-${Date.now()}-${Math.random()}@example.com`;
        const registerBResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'User B',
            email: userBEmail,
            password: 'password123',
          })
          .expect(201);

        const tokenB = registerBResponse.body.token;

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
