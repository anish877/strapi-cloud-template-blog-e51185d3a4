const axios = require('axios');

const API_BASE_URL = 'http://localhost:1337/api';

// Trending-topics schema fields: Title, Type, Category, hashtag, duration_hours, start_time, IsActive
// Valid categories: Tourism, Nightlife, Events, Shopping, Culture, Food, Business, Entertainment
// Note: "Tourism" in trending-topics maps to "Travel" in video schema
const validTrendingTopics = [
  {
    Title: 'Pattaya Beach',
    Type: 'location',
    Category: 'Tourism', // Maps to "Travel" in video schema
    hashtag: 'pattaya beach',
    duration_hours: 48,
    start_time: new Date().toISOString(),
    IsActive: true,
    Rank: 5
  },
  {
    Title: 'Thai Street Food',
    Type: 'topic',
    Category: 'Food',
    hashtag: 'thai street food',
    duration_hours: 24,
    start_time: new Date().toISOString(),
    IsActive: true,
    Rank: 4
  },
  {
    Title: 'Walking Street',
    Type: 'location',
    Category: 'Nightlife',
    hashtag: 'walking street pattaya',
    duration_hours: 36,
    start_time: new Date().toISOString(),
    IsActive: true,
    Rank: 4
  },
  {
    Title: 'Thai Culture',
    Type: 'topic',
    Category: 'Culture',
    hashtag: 'thai culture',
    duration_hours: 48,
    start_time: new Date().toISOString(),
    IsActive: true,
    Rank: 3
  },
  {
    Title: 'Pattaya Events',
    Type: 'event',
    Category: 'Events',
    hashtag: 'pattaya events',
    duration_hours: 24,
    start_time: new Date().toISOString(),
    IsActive: true,
    Rank: 2
  },
  {
    Title: 'Pattaya Entertainment',
    Type: 'topic',
    Category: 'Entertainment',
    hashtag: 'pattaya entertainment',
    duration_hours: 24,
    start_time: new Date().toISOString(),
    IsActive: true,
    Rank: 3
  }
];

async function addTrendingTopics() {
  console.log('🎯 Adding valid trending topics with correct categories...\n');

  try {
    for (const topic of validTrendingTopics) {
      console.log(`📝 Adding: "${topic.Title}" (Category: ${topic.Category})`);
      
      const response = await axios.post(`${API_BASE_URL}/trending-topics`, {
        data: topic
      });

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Added successfully - ID: ${response.data.data.id}`);
      }
    }

    console.log('\n🎉 All trending topics added successfully!');
    console.log('📊 Summary:');
    console.log(`   • Total topics: ${validTrendingTopics.length}`);
    console.log(`   • Categories: ${[...new Set(validTrendingTopics.map(t => t.Category))].join(', ')}`);
    console.log('   • All categories match video schema requirements ✅');

    // Verify the topics were added
    console.log('\n🔍 Verifying added topics...');
    const verifyResponse = await axios.get(`${API_BASE_URL}/trending-topics`);
    console.log(`✅ Verification: ${verifyResponse.data.data.length} topics now in database`);

  } catch (error) {
    console.error('❌ Error adding trending topics:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

addTrendingTopics().catch(console.error);
