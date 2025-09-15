const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function initializeNewsSettings() {
  const baseUrl = 'http://localhost:1337/api';
  
  console.log('🚀 Initializing News Settings...\n');

  try {
    // Check if news-settings already exists
    console.log('📋 Checking if news-settings exists...');
    const checkResponse = await fetch(`${baseUrl}/news-settings`);
    
    if (checkResponse.ok) {
      const existingData = await checkResponse.json();
      console.log('✅ News settings already exists:');
      console.log(`   - Max Article Limit: ${existingData.data.maxArticleLimit}`);
      console.log(`   - Max Article Age: ${existingData.data.maxArticleAgeHours} hours`);
      console.log(`   - Cleanup Mode: ${existingData.data.cleanupMode}`);
      return;
    }

    // Create initial news-settings
    console.log('➕ Creating initial news-settings...');
    const initialSettings = {
      data: {
        fetchIntervalMinutes: 30,
        moderationKeywords: ["spam", "fake", "clickbait", "scam", "adult", "explicit"],
        autoModerationEnabled: true,
        maxArticlesPerFetch: 20,
        enableVoting: true,
        cronJobEnabled: true,
        newsApiCountry: "th",
        newsApiCategory: "general",
        maxArticleLimit: 21,
        maxArticleAgeHours: 24,
        cleanupMode: "both_count_and_age",
        cleanupFrequencyMinutes: 60,
        preservePinnedArticles: true,
        preserveBreakingNews: true,
        cleanupStats: {
          totalDeleted: 0,
          lastDeletedCount: 0,
          lastCleanupDate: null
        }
      }
    };

    const createResponse = await fetch(`${baseUrl}/news-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialSettings)
    });

    if (createResponse.ok) {
      const createdData = await createResponse.json();
      console.log('✅ News settings created successfully:');
      console.log(`   - Max Article Limit: ${createdData.data.maxArticleLimit}`);
      console.log(`   - Max Article Age: ${createdData.data.maxArticleAgeHours} hours`);
      console.log(`   - Cleanup Mode: ${createdData.data.cleanupMode}`);
      console.log(`   - Cleanup Frequency: ${createdData.data.cleanupFrequencyMinutes} minutes`);
      console.log(`   - Preserve Pinned: ${createdData.data.preservePinnedArticles}`);
      console.log(`   - Preserve Breaking: ${createdData.data.preserveBreakingNews}`);
    } else {
      const errorData = await createResponse.json().catch(() => ({}));
      console.log(`❌ Failed to create news settings: ${createResponse.status} - ${errorData.message || createResponse.statusText}`);
    }

  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
  }
}

// Run the initialization
initializeNewsSettings();
