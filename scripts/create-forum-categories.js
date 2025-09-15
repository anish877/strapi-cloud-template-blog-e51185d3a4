'use strict';

/**
 * Script to create default forum categories
 * Run with: node scripts/create-forum-categories.js
 */

const { createStrapi } = require('@strapi/strapi');

async function createForumCategories() {
  console.log('🚀 Starting Strapi to create forum categories...');
  
  const strapi = await createStrapi({
    appDir: process.cwd(),
    distDir: './dist',
  });

  await strapi.start();

  console.log('📝 Creating forum categories...');
  
  const categories = [
    {
      name: 'General Discussion',
      slug: 'general-discussion',
      description: 'General conversations about Pattaya',
      icon: 'message-square',
      color: '#3B82F6',
      sortOrder: 1,
      isActive: true
    },
    {
      name: 'Visas & Immigration',
      slug: 'visas-immigration',
      description: 'Questions about visas, work permits, and immigration',
      icon: 'file-text',
      color: '#10B981',
      sortOrder: 2,
      isActive: true
    },
    {
      name: 'Nightlife & Entertainment',
      slug: 'nightlife-entertainment',
      description: 'Bars, clubs, shows, and nightlife discussions',
      icon: 'music',
      color: '#8B5CF6',
      sortOrder: 3,
      isActive: true
    },
    {
      name: 'Restaurants & Food',
      slug: 'restaurants-food',
      description: 'Restaurant reviews, food recommendations, and dining',
      icon: 'utensils',
      color: '#F59E0B',
      sortOrder: 4,
      isActive: true
    },
    {
      name: 'Accommodation',
      slug: 'accommodation',
      description: 'Hotels, condos, and accommodation discussions',
      icon: 'home',
      color: '#EF4444',
      sortOrder: 5,
      isActive: true
    },
    {
      name: 'Transportation',
      slug: 'transportation',
      description: 'Getting around Pattaya - taxis, buses, motorbikes',
      icon: 'car',
      color: '#06B6D4',
      sortOrder: 6,
      isActive: true
    },
    {
      name: 'Business & Work',
      slug: 'business-work',
      description: 'Business opportunities, jobs, and work discussions',
      icon: 'briefcase',
      color: '#84CC16',
      sortOrder: 7,
      isActive: true
    },
    {
      name: 'Health & Medical',
      slug: 'health-medical',
      description: 'Medical services, hospitals, and health discussions',
      icon: 'heart',
      color: '#EC4899',
      sortOrder: 8,
      isActive: true
    }
  ];

  try {
    for (const categoryData of categories) {
      // Check if category already exists
      const existing = await strapi.entityService.findMany('api::forum-category.forum-category', {
        filters: { slug: categoryData.slug }
      });

      if (!existing || existing.length === 0) {
        await strapi.entityService.create('api::forum-category.forum-category', {
          data: categoryData
        });
        console.log(`✅ Created category: ${categoryData.name}`);
      } else {
        console.log(`⏭️  Category already exists: ${categoryData.name}`);
      }
    }
    
    console.log('🎉 Forum categories setup complete!');
  } catch (error) {
    console.error('❌ Error creating forum categories:', error);
  } finally {
    await strapi.destroy();
  }
}

// Run the function
createForumCategories().then(() => {
  console.log('✅ Forum categories script completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
