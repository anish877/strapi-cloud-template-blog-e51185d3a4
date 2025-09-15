const axios = require('axios');

// Debug script to test search API endpoints
const BASE_URL = 'http://localhost:1337';

async function testSearchEndpoints() {
  console.log('🔍 Testing Search API Endpoints...\n');

  // Test Algolia search
  try {
    console.log('Testing Algolia search...');
    const response = await axios.get(`${BASE_URL}/api/search?q=news&limit=5`);
    console.log('✅ Algolia search:', response.data.results?.length || 0, 'results');
  } catch (error) {
    console.log('❌ Algolia search failed:', error.message);
  }

  // Test Google CSE search
  try {
    console.log('Testing Google CSE search...');
    const response = await axios.get(`${BASE_URL}/api/web-search/search?q=thailand&num=5`);
    console.log('✅ Google CSE search:', response.data.items?.length || 0, 'results');
  } catch (error) {
    console.log('❌ Google CSE search failed:', error.message);
  }

  // Test Local search
  try {
    console.log('Testing Local search...');
    const response = await axios.get(`${BASE_URL}/api/local-search/search?q=breaking&limit=5`);
    console.log('✅ Local search:', response.data.results?.length || 0, 'results');
  } catch (error) {
    console.log('❌ Local search failed:', error.message);
  }

  console.log('\n🏁 Search API testing complete!');
}

testSearchEndpoints();
