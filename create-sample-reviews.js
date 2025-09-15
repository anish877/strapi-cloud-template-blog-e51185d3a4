#!/usr/bin/env node

/**
 * Create sample reviews for testing the frontend widget
 * Run with: node create-sample-reviews.js
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
    AuthorProfilePhotoUrl: null,
    AuthorProfileUrl: null,
    Rating: 5,
    ReviewText: 'Amazing beach views and great restaurants! Pattaya has everything you need for a perfect vacation.',
    ReviewTime: new Date('2024-01-15T10:30:00Z'),
    RelativeTimeDescription: '2 days ago',
    BusinessName: 'Pattaya Beach',
    BusinessAddress: 'Pattaya Beach, Chon Buri, Thailand',
    BusinessType: 'Tourism',
    BusinessUrl: null,
    Verified: false,
    IsActive: true,
    Featured: true,
    Category: 'Tourism',
    Location: 'Pattaya Beach, Chon Buri, Thailand',
    Language: 'en',
    LastUpdated: new Date(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  {
    source_platform: 'Foursquare',
    source_review_id: 'foursquare_sample_2',
    AuthorName: 'Mike Chen',
    AuthorProfilePhotoUrl: null,
    AuthorProfileUrl: null,
    Rating: 4,
    ReviewText: 'Great nightlife and entertainment options. The Walking Street is incredible with so many bars and clubs.',
    ReviewTime: new Date('2024-01-14T20:15:00Z'),
    RelativeTimeDescription: '3 days ago',
    BusinessName: 'Walking Street',
    BusinessAddress: 'Walking Street, Pattaya, Thailand',
    BusinessType: 'Nightlife',
    BusinessUrl: null,
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
    AuthorProfilePhotoUrl: null,
    AuthorProfileUrl: null,
    Rating: 5,
    ReviewText: 'The seafood here is absolutely fantastic! Fresh catches every day and reasonable prices.',
    ReviewTime: new Date('2024-01-13T18:45:00Z'),
    RelativeTimeDescription: '4 days ago',
    BusinessName: 'Pattaya Seafood Market',
    BusinessAddress: 'Pattaya Seafood Market, Chon Buri, Thailand',
    BusinessType: 'Restaurant',
    BusinessUrl: null,
    Verified: false,
    IsActive: true,
    Featured: true,
    Category: 'Restaurant',
    Location: 'Pattaya Seafood Market, Chon Buri, Thailand',
    Language: 'en',
    LastUpdated: new Date(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    source_platform: 'Foursquare',
    source_review_id: 'foursquare_sample_4',
    AuthorName: 'David Kim',
    AuthorProfilePhotoUrl: null,
    AuthorProfileUrl: null,
    Rating: 4,
    ReviewText: 'Beautiful temples and cultural sites. The Sanctuary of Truth is a must-visit architectural marvel.',
    ReviewTime: new Date('2024-01-12T14:20:00Z'),
    RelativeTimeDescription: '5 days ago',
    BusinessName: 'Sanctuary of Truth',
    BusinessAddress: 'Sanctuary of Truth, Pattaya, Thailand',
    BusinessType: 'Tourism',
    BusinessUrl: null,
    Verified: false,
    IsActive: true,
    Featured: false,
    Category: 'Tourism',
    Location: 'Sanctuary of Truth, Pattaya, Thailand',
    Language: 'en',
    LastUpdated: new Date(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    source_platform: 'Foursquare',
    source_review_id: 'foursquare_sample_5',
    AuthorName: 'Lisa Rodriguez',
    AuthorProfilePhotoUrl: null,
    AuthorProfileUrl: null,
    Rating: 5,
    ReviewText: 'Amazing spa treatments and relaxation services. Perfect for unwinding after a day of sightseeing.',
    ReviewTime: new Date('2024-01-11T16:30:00Z'),
    RelativeTimeDescription: '6 days ago',
    BusinessName: 'Pattaya Spa Resort',
    BusinessAddress: 'Pattaya Spa Resort, Chon Buri, Thailand',
    BusinessType: 'Spa',
    BusinessUrl: null,
    Verified: false,
    IsActive: true,
    Featured: true,
    Category: 'Spa',
    Location: 'Pattaya Spa Resort, Chon Buri, Thailand',
    Language: 'en',
    LastUpdated: new Date(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
];

async function createSampleReviews() {
  console.log('🧪 Creating sample reviews for testing...\n');

  try {
    const ReviewService = require('./src/api/google-review/services/google-review');
    const reviewService = new ReviewService();
    
    console.log('📝 Creating sample reviews...');
    const result = await reviewService.saveReviews(sampleReviews, 30);
    
    console.log('\n📊 Results:');
    console.log(`✅ Created: ${result.success_count} reviews`);
    console.log(`⏭️ Skipped: ${result.skip_count} reviews`);
    console.log(`📋 Total processed: ${result.total_processed} reviews`);
    
    if (result.saved && result.saved.length > 0) {
      console.log('\n📝 Sample reviews created:');
      result.saved.forEach((review, index) => {
        console.log(`${index + 1}. ${review.AuthorName} - ${review.BusinessName} (${review.Rating}⭐)`);
        console.log(`   "${review.ReviewText.substring(0, 60)}..."`);
      });
    }
    
    console.log('\n🎉 Sample reviews created successfully!');
    console.log('\n🔍 You can now test the frontend widget by:');
    console.log('1. Starting the frontend: cd ../pattaya1 && npm run dev');
    console.log('2. Visiting the homepage to see the reviews widget');
    console.log('3. Testing the API endpoint: curl "http://localhost:1337/api/reviews/latest?limit=5"');
    
  } catch (error) {
    console.error('❌ Error creating sample reviews:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
createSampleReviews().catch(console.error);
