// MongoDB initialization script
// This script runs when the MongoDB container is first created

db = db.getSiblingDB('blog_platform');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 2,
          description: 'Name is required and must be at least 2 characters'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Email is required and must be valid'
        },
        password: {
          bsonType: 'string',
          description: 'Password is required'
        },
        profilePicture: {
          bsonType: ['string', 'null'],
          description: 'Profile picture URL'
        }
      }
    }
  }
});

db.createCollection('posts');
db.createCollection('comments');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.posts.createIndex({ title: 'text', content: 'text' });
db.posts.createIndex({ author: 1 });
db.posts.createIndex({ createdAt: -1 });
db.comments.createIndex({ post: 1 });
db.comments.createIndex({ author: 1 });

print('Database initialized successfully!');
