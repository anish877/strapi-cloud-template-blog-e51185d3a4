#!/usr/bin/env node

/**
 * Insert sample reviews directly into the database
 * Run with: node insert-sample-reviews.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const sampleReviews = [
  {
    source_platform: 'Foursquare',
    source_review_id: 'foursquare_sample_1',
    AuthorName: 'Sarah Johnson',
    Rating: 5,
    ReviewText: 'Amazing beach views and great restaurants! Pattaya has everything you need for a perfect vacation.',
    ReviewTime: new Date('2024-01-15T10:30:00Z').toISOString(),
    BusinessName: 'Pattaya Beach',
    BusinessAddress: 'Pattaya Beach, Chon Buri, Thailand',
    BusinessType: 'Tourism',
    Verified: false,
    IsActive: true,
    Featured: true,
    Category: 'Tourism',
    Location: 'Pattaya Beach, Chon Buri, Thailand',
    Language: 'en',
    LastUpdated: new Date().toISOString(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source_platform: 'Foursquare',
    source_review_id: 'foursquare_sample_2',
    AuthorName: 'Mike Chen',
    Rating: 4,
    ReviewText: 'Great nightlife and entertainment options. The Walking Street is incredible with so many bars and clubs.',
    ReviewTime: new Date('2024-01-14T20:15:00Z').toISOString(),
    BusinessName: 'Walking Street',
    BusinessAddress: 'Walking Street, Pattaya, Thailand',
    BusinessType: 'Nightlife',
    Verified: false,
    IsActive: true,
    Featured: false,
    Category: 'Nightlife',
    Location: 'Walking Street, Pattaya, Thailand',
    Language: 'en',
    LastUpdated: new Date().toISOString(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source_platform: 'Foursquare',
    source_review_id: 'foursquare_sample_3',
    AuthorName: 'Emma Wilson',
    Rating: 5,
    ReviewText: 'The seafood here is absolutely fantastic! Fresh catches every day and reasonable prices.',
    ReviewTime: new Date('2024-01-13T18:45:00Z').toISOString(),
    BusinessName: 'Pattaya Seafood Market',
    BusinessAddress: 'Pattaya Seafood Market, Chon Buri, Thailand',
    BusinessType: 'Restaurant',
    Verified: false,
    IsActive: true,
    Featured: true,
    Category: 'Restaurant',
    Location: 'Pattaya Seafood Market, Chon Buri, Thailand',
    Language: 'en',
    LastUpdated: new Date().toISOString(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source_platform: 'Foursquare',
    source_review_id: 'foursquare_sample_4',
    AuthorName: 'David Kim',
    Rating: 4,
    ReviewText: 'Beautiful temples and cultural sites. The Sanctuary of Truth is a must-visit architectural marvel.',
    ReviewTime: new Date('2024-01-12T14:20:00Z').toISOString(),
    BusinessName: 'Sanctuary of Truth',
    BusinessAddress: 'Sanctuary of Truth, Pattaya, Thailand',
    BusinessType: 'Tourism',
    Verified: false,
    IsActive: true,
    Featured: false,
    Category: 'Tourism',
    Location: 'Sanctuary of Truth, Pattaya, Thailand',
    Language: 'en',
    LastUpdated: new Date().toISOString(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source_platform: 'Foursquare',
    source_review_id: 'foursquare_sample_5',
    AuthorName: 'Lisa Rodriguez',
    Rating: 5,
    ReviewText: 'Amazing spa treatments and relaxation services. Perfect for unwinding after a day of sightseeing.',
    ReviewTime: new Date('2024-01-11T16:30:00Z').toISOString(),
    BusinessName: 'Pattaya Spa Resort',
    BusinessAddress: 'Pattaya Spa Resort, Chon Buri, Thailand',
    BusinessType: 'Spa',
    Verified: false,
    IsActive: true,
    Featured: true,
    Category: 'Spa',
    Location: 'Pattaya Spa Resort, Chon Buri, Thailand',
    Language: 'en',
    LastUpdated: new Date().toISOString(),
    cache_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

async function insertSampleReviews() {
  console.log('🧪 Inserting sample reviews into database...\n');

  const dbPath = path.join(__dirname, '.tmp', 'data.db');
  console.log(`📁 Database path: ${dbPath}`);

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err.message);
      return;
    }
    console.log('✅ Connected to SQLite database');
  });

  try {
    // Check if google_reviews table exists
    const tableExists = await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='google_reviews'", (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });

    if (!tableExists) {
      console.log('❌ google_reviews table does not exist. Please start Strapi first to create the table.');
      return;
    }

    console.log('✅ google_reviews table exists');

    // Insert sample reviews
    let insertedCount = 0;
    for (const review of sampleReviews) {
      const insertQuery = `
        INSERT OR IGNORE INTO google_reviews (
          source_platform, source_review_id, AuthorName, Rating, ReviewText, 
          ReviewTime, BusinessName, BusinessAddress, BusinessType, Verified, 
          IsActive, Featured, Category, Location, Language, LastUpdated, 
          cache_expiry_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date().toISOString();
      const values = [
        review.source_platform,
        review.source_review_id,
        review.AuthorName,
        review.Rating,
        review.ReviewText,
        review.ReviewTime,
        review.BusinessName,
        review.BusinessAddress,
        review.BusinessType,
        review.Verified ? 1 : 0,
        review.IsActive ? 1 : 0,
        review.Featured ? 1 : 0,
        review.Category,
        review.Location,
        review.Language,
        review.LastUpdated,
        review.cache_expiry_date,
        now,
        now
      ];

      await new Promise((resolve, reject) => {
        db.run(insertQuery, values, function(err) {
          if (err) {
            console.error(`❌ Error inserting review ${review.source_review_id}:`, err.message);
            reject(err);
          } else {
            if (this.changes > 0) {
              insertedCount++;
              console.log(`✅ Inserted review: ${review.AuthorName} - ${review.BusinessName} (${review.Rating}⭐)`);
            } else {
              console.log(`⏭️ Skipped duplicate review: ${review.source_review_id}`);
            }
            resolve();
          }
        });
      });
    }

    console.log(`\n📊 Results:`);
    console.log(`✅ Inserted: ${insertedCount} reviews`);
    console.log(`⏭️ Skipped: ${sampleReviews.length - insertedCount} reviews (duplicates)`);
    
    console.log('\n🎉 Sample reviews inserted successfully!');
    console.log('\n🔍 You can now test:');
    console.log('1. API endpoint: curl "http://localhost:1337/api/reviews/latest?limit=5"');
    console.log('2. Frontend widget: Start the frontend and visit the homepage');

  } catch (error) {
    console.error('❌ Error inserting sample reviews:', error.message);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
}

// Run the script
insertSampleReviews().catch(console.error);
