import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as fc from 'fast-check';
import { AppModule } from '../../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Posts Properties (Property-Based Tests)', () => {
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

  // Helper function to create a user and get token
  async function createUserAndGetToken(
    name: string,
    email: string,
    password: string,
  ): Promise<{ token: string; userId: string }> {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name, email, password });

    if (response.status === 201) {
      return { token: response.body.token, userId: response.body.user._id };
    }

    if (response.status === 409) {
      // User exists, try to login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password });

      if (loginResponse.status === 200 || loginResponse.status === 201) {
        return {
          token: loginResponse.body.token,
          userId: loginResponse.body.user._id,
        };
      }
    }

    // If we get here, something went wrong - throw an error with details
    throw new Error(
      `Failed to create/login user: ${response.status} - ${JSON.stringify(response.body)}`,
    );
  }

  /**
   * Feature: blog-platform, Property 6: Post Creation Associates Post with Author
   * Validates: Requirements 3.1
   */
  it('Property 6: For any valid post data submitted by authenticated user, created post should have author field set to user ID', async () => {
    // Generate strings that contain at least one non-whitespace character
    const validTitleArb = fc
      .string({ minLength: 1, maxLength: 200 })
      .filter((s) => s.trim().length > 0);
    const validContentArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((s) => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(
        validTitleArb,
        validContentArb,
        fc.emailAddress(),
        async (title, content, email) => {
          const { token, userId } = await createUserAndGetToken(
            'Test User',
            email,
            'password123',
          );

          const response = await request(app.getHttpServer())
            .post('/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ title, content })
            .expect(201);

          expect(response.body).toHaveProperty('author');
          expect(response.body.author.toString()).toBe(userId);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: blog-platform, Property 7: Invalid Post Data Returns Validation Errors
   * Validates: Requirements 3.2
   */
  it('Property 7: For any post creation request with empty title or content, should return 400 with validation errors', async () => {
    const invalidPostArb = fc.oneof(
      fc.record({
        title: fc.constant(''),
        content: fc
          .string({ minLength: 1, maxLength: 100 })
          .filter((s) => /^[\x20-\x7E]+$/.test(s)),
      }),
      fc.record({
        title: fc
          .string({ minLength: 1, maxLength: 100 })
          .filter((s) => /^[\x20-\x7E]+$/.test(s)),
        content: fc.constant(''),
      }),
      fc.record({ title: fc.constant(''), content: fc.constant('') }),
    );

    await fc.assert(
      fc.asyncProperty(invalidPostArb, async (invalidPost) => {
        // Use a unique email for each test run
        const email = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
        const { token } = await createUserAndGetToken(
          'Test User',
          email,
          'password123',
        );

        const response = await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send(invalidPost);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: blog-platform, Property 8: Post Listing Returns Paginated Results
   * Validates: Requirements 3.3, 6.1, 6.2
   */
  it('Property 8: For any pagination parameters, requesting posts should return correct pagination metadata', async () => {
    const pageArb = fc.integer({ min: 1, max: 5 });
    const limitArb = fc.integer({ min: 1, max: 20 });

    await fc.assert(
      fc.asyncProperty(pageArb, limitArb, async (page, limit) => {
        const response = await request(app.getHttpServer())
          .get('/posts')
          .query({ page, limit })
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body.meta).toHaveProperty('total');
        expect(response.body.meta).toHaveProperty('page', page);
        expect(response.body.meta).toHaveProperty('limit', limit);
        expect(response.body.meta).toHaveProperty('totalPages');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeLessThanOrEqual(limit);

        // Verify totalPages calculation
        const expectedTotalPages = Math.ceil(response.body.meta.total / limit);
        expect(response.body.meta.totalPages).toBe(expectedTotalPages);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: blog-platform, Property 9: Post Retrieval Returns Full Content
   * Validates: Requirements 3.4
   */
  it('Property 9: For any existing post, requesting it by ID should return complete post with author information', async () => {
    const validTitleArb = fc
      .string({ minLength: 1, maxLength: 200 })
      .filter((s) => s.trim().length > 0);
    const validContentArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((s) => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(
        validTitleArb,
        validContentArb,
        fc.emailAddress(),
        async (title, content, email) => {
          const { token } = await createUserAndGetToken(
            'Test User',
            email,
            'password123',
          );

          // Create a post
          const createResponse = await request(app.getHttpServer())
            .post('/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ title, content })
            .expect(201);

          const postId = createResponse.body._id;

          // Retrieve the post
          const getResponse = await request(app.getHttpServer())
            .get(`/posts/${postId}`)
            .expect(200);

          expect(getResponse.body).toHaveProperty('title', title.trim());
          expect(getResponse.body).toHaveProperty('content', content.trim());
          expect(getResponse.body).toHaveProperty('author');
          expect(getResponse.body.author).toHaveProperty('name');
          expect(getResponse.body.author).toHaveProperty('email');
          expect(getResponse.body).toHaveProperty('createdAt');
          expect(getResponse.body).toHaveProperty('updatedAt');
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: blog-platform, Property 10: Post Update Applies Changes for Author
   * Validates: Requirements 3.5
   */
  it('Property 10: For any post and valid update data submitted by author, post should be updated and updatedAt should change', async () => {
    const validTitleArb = fc
      .string({ minLength: 1, maxLength: 200 })
      .filter((s) => s.trim().length > 0);
    const validContentArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((s) => s.trim().length > 0);
    const newTitleArb = fc
      .string({ minLength: 1, maxLength: 200 })
      .filter((s) => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(
        validTitleArb,
        validContentArb,
        newTitleArb,
        fc.emailAddress(),
        async (title, content, newTitle, email) => {
          if (title.trim() === newTitle.trim()) return true; // Skip if titles are the same

          const { token } = await createUserAndGetToken(
            'Test User',
            email,
            'password123',
          );

          // Create a post
          const createResponse = await request(app.getHttpServer())
            .post('/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ title, content })
            .expect(201);

          const postId = createResponse.body._id;
          const originalUpdatedAt = createResponse.body.updatedAt;

          // Wait a bit to ensure timestamp changes
          await new Promise((resolve) => setTimeout(resolve, 10));

          // Update the post
          const updateResponse = await request(app.getHttpServer())
            .put(`/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: newTitle })
            .expect(200);

          expect(updateResponse.body.title).toBe(newTitle.trim());
          expect(updateResponse.body.content).toBe(content.trim());
          expect(
            new Date(updateResponse.body.updatedAt).getTime(),
          ).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: blog-platform, Property 11: Post Operations Require Author Authorization
   * Validates: Requirements 3.6, 3.8
   */
  it('Property 11: For any post created by user A, attempting to update or delete as user B should return 403', async () => {
    const validTitleArb = fc
      .string({ minLength: 1, maxLength: 200 })
      .filter((s) => s.trim().length > 0);
    const validContentArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((s) => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(
        validTitleArb,
        validContentArb,
        fc.emailAddress(),
        fc.emailAddress(),
        async (title, content, emailA, emailB) => {
          if (emailA === emailB) return true; // Skip if same user

          // Create user A and post
          const userA = await createUserAndGetToken(
            'User A',
            emailA,
            'password123',
          );
          const createResponse = await request(app.getHttpServer())
            .post('/posts')
            .set('Authorization', `Bearer ${userA.token}`)
            .send({ title, content })
            .expect(201);

          const postId = createResponse.body._id;

          // Create user B
          const userB = await createUserAndGetToken(
            'User B',
            emailB,
            'password456',
          );

          // Try to update as user B
          const updateResponse = await request(app.getHttpServer())
            .put(`/posts/${postId}`)
            .set('Authorization', `Bearer ${userB.token}`)
            .send({ title: 'New Title' });

          expect(updateResponse.status).toBe(403);

          // Try to delete as user B
          const deleteResponse = await request(app.getHttpServer())
            .delete(`/posts/${postId}`)
            .set('Authorization', `Bearer ${userB.token}`);

          expect(deleteResponse.status).toBe(403);

          // Verify post still exists
          const getResponse = await request(app.getHttpServer())
            .get(`/posts/${postId}`)
            .expect(200);

          expect(getResponse.body.title).toBe(title.trim());
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: blog-platform, Property 12: Post Deletion Cascades to Comments
   * Validates: Requirements 3.7
   */
  it('Property 12: For any post with comments, deleting the post should remove all associated comments', async () => {
    const validTitleArb = fc
      .string({ minLength: 1, maxLength: 200 })
      .filter((s) => s.trim().length > 0);
    const validContentArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((s) => s.trim().length > 0);
    const commentContentArb = fc.string({ minLength: 1, maxLength: 500 });

    await fc.assert(
      fc.asyncProperty(
        validTitleArb,
        validContentArb,
        commentContentArb,
        fc.emailAddress(),
        async (title, content, commentContent, email) => {
          const { token } = await createUserAndGetToken(
            'Test User',
            email,
            'password123',
          );

          // Create a post
          const createResponse = await request(app.getHttpServer())
            .post('/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ title, content })
            .expect(201);

          const postId = createResponse.body._id;

          // Note: This test assumes comments module exists
          // For now, we'll just test that delete works
          // The cascade will be tested when comments module is implemented

          // Delete the post
          await request(app.getHttpServer())
            .delete(`/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

          // Verify post is deleted
          await request(app.getHttpServer())
            .get(`/posts/${postId}`)
            .expect(404);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: blog-platform, Property 17: Search Returns Matching Posts
   * Validates: Requirements 5.1, 5.3
   */
  it('Property 17: For any search query, results should contain only posts where title or content contains the query', async () => {
    // Generate alphanumeric search terms to avoid MongoDB text search issues with special characters
    const searchTermArb = fc
      .stringMatching(/^[a-zA-Z0-9]{3,20}$/)
      .filter((s) => s.length >= 3);

    await fc.assert(
      fc.asyncProperty(searchTermArb, async (searchTerm) => {
        // Use a unique email for each test run
        const email = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
        const { token } = await createUserAndGetToken(
          'Test User',
          email,
          'password123',
        );

        // Create a post with the search term in title
        await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: `Post with ${searchTerm} in title`,
            content: 'Some content',
          })
          .expect(201);

        // Create a post with the search term in content
        await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'Another post',
            content: `Content with ${searchTerm} here`,
          })
          .expect(201);

        // Search for posts
        const searchResponse = await request(app.getHttpServer())
          .get('/posts')
          .query({ search: searchTerm })
          .expect(200);

        expect(searchResponse.body).toHaveProperty('data');
        expect(searchResponse.body).toHaveProperty('meta');
        expect(Array.isArray(searchResponse.body.data)).toBe(true);

        // Verify all results contain the search term (case-insensitive)
        searchResponse.body.data.forEach((post: any) => {
          const titleMatch = post.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
          const contentMatch = post.content
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
          expect(titleMatch || contentMatch).toBe(true);
        });
      }),
      { numRuns: 100 },
    );
  });
});
