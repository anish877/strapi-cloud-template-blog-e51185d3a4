
#!/usr/bin/env node

/**
 * Add sample reviews using Strapi service
 * Run with: node add-sample-reviews.js
 */

require('dotenv').config();

// Mock Strapi for testing
global.strapi = {
  log: {
    info: console.log,
    error: console.error,
    warn: console.warn
  },
  entityService: {
    create: async (type, data) => {
      console.log(`Creating ${type}:`, data.data);
      return { id: Math.random(), ...data.data };
    },
    findMany: async (type, options) => {
      console.log(`Finding ${type} with options:`, options);
      return [];
    }
  }
};

const sampleReviews = [
  {
    source_platform: 'Foursquare',
    source_review_id: 'foursquare_sample_1',
    AuthorName: 'Sarah Johnson',
    Rating: 5,
    ReviewText: 'Amazing beach views and great restaurants! Pattaya has everything you need for a perfect vacation.',
    ReviewTime: new Date('2024-01-15T10:30:00Z'),
    BusinessName: 'Pattaya Beach',
    BusinessAddress: 'Pattaya Beach, Chon Buri, Thailand',
    BusinessType: 'Tourism',
    Verified: false,
    IsActive: true,
    Featured: true,
    Category: 'Tourism',
    Location: 'Pattaya Beach, Chon Buri, Thailand',
    Language: 'en',
    LastUpdated: new Date(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    source_platform: 'Foursquare',
    source_review_id: 'foursquare_sample_2',
    AuthorName: 'Mike Chen',
    Rating: 4,
    ReviewText: 'Great nightlife and entertainment options. The Walking Street is incredible with so many bars and clubs.',
    ReviewTime: new Date('2024-01-14T20:15:00Z'),
    BusinessName: 'Walking Street',
    BusinessAddress: 'Walking Street, Pattaya, Thailand',
    BusinessType: 'Nightlife',
    Verified: false,
    IsActive: true,
    Featured: false,
    Category: 'Nightlife',
    Location: 'Walking Street, Pattaya, Thailand',
    Language: 'en',
    LastUpdated: new Date(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    source_platform: 'Foursquare',
    source_review_id: 'foursquare_sample_3',
    AuthorName: 'Emma Wilson',
    Rating: 5,
    ReviewText: 'The seafood here is absolutely fantastic! Fresh catches every day and reasonable prices.',
    ReviewTime: new Date('2024-01-13T18:45:00Z'),
    BusinessName: 'Pattaya Seafood Market',
    BusinessAddress: 'Pattaya Seafood Market, Chon Buri, Thailand',
    BusinessType: 'Restaurant',
    Verified: false,
    IsActive: true,
    Featured: true,
    Category: 'Restaurant',
    Location: 'Pattaya Seafood Market, Chon Buri, Thailand',
    Language: 'en',
    LastUpdated: new Date(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
];

async function addSampleReviews() {
  console.log('🧪 Adding sample reviews for testing...\n');

  try {
    // Create reviews directly using fetch to Strapi API
    const baseUrl = 'http://localhost:1337';
    let successCount = 0;
    let errorCount = 0;

    for (const review of sampleReviews) {
      try {
        const response = await fetch(`${baseUrl}/api/google-reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: review })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Created review: ${review.AuthorName} - ${review.BusinessName} (${review.Rating}⭐)`);
          successCount++;
        } else {
          const error = await response.text();
          console.log(`❌ Failed to create review: ${review.AuthorName} - ${error}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`❌ Error creating review: ${review.AuthorName} - ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`✅ Created: ${successCount} reviews`);
    console.log(`❌ Failed: ${errorCount} reviews`);
    
    if (successCount > 0) {
      console.log('\n🎉 Sample reviews added successfully!');
      console.log('\n🔍 You can now test:');
      console.log('1. API endpoint: curl "http://localhost:1337/api/reviews/latest?limit=5"');
      console.log('2. Frontend widget: Start the frontend and visit the homepage');
    }
    
  } catch (error) {
    console.error('❌ Error adding sample reviews:', error.message);
  }
}

// Run the script
addSampleReviews().catch(console.error);
