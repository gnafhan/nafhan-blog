/**
 * Migration script to add slugs to existing posts that don't have them.
 * This can be run as a one-time migration or called on-demand.
 *
 * Usage: npx ts-node src/posts/migrate-slugs.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { generateSlug, ensureUniqueSlug } from './slug.util';

async function migratePostSlugs() {
  console.log('Starting slug migration...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const postModel = app.get<Model<PostDocument>>(getModelToken(Post.name));

  try {
    // Find all posts without slugs
    const postsWithoutSlugs = await postModel
      .find({
        $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
      })
      .exec();

    console.log(`Found ${postsWithoutSlugs.length} posts without slugs`);

    let migratedCount = 0;
    for (const post of postsWithoutSlugs) {
      const baseSlug = generateSlug(post.title);
      const uniqueSlug = await ensureUniqueSlug(
        baseSlug,
        postModel,
        post._id?.toString(),
      );

      await postModel
        .updateOne({ _id: post._id }, { $set: { slug: uniqueSlug } })
        .exec();

      console.log(`Migrated post "${post.title}" -> slug: "${uniqueSlug}"`);
      migratedCount++;
    }

    console.log(`\nMigration complete! Migrated ${migratedCount} posts.`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migratePostSlugs()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migratePostSlugs };
