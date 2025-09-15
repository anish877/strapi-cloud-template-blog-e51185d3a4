const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createTestArticle() {
  const baseUrl = 'http://localhost:1337/api/breaking-news';
  
  console.log('📝 Creating test article for upvote testing...\n');

  try {
    const testArticle = {
      data: {
        Title: "Test Article for Upvote System",
        Summary: "This is a test article to verify the upvote system is working correctly.",
        Category: "Test",
        Source: "Test Source",
        URL: "https://example.com/test-article",
        IsBreaking: false,
        PublishedTimestamp: new Date().toISOString(),
        isPinned: false,
        voteScore: 0,
        upvotes: 0,
        downvotes: 0,
        userVotes: {},
        moderationStatus: "approved",
        isHidden: false,
        fetchedFromAPI: false,
        publishedAt: new Date().toISOString()
      }
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testArticle)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Test article created successfully!');
      console.log(`   - ID: ${data.data.documentId}`);
      console.log(`   - Title: ${data.data.Title}`);
      console.log(`   - Initial votes: 👍 ${data.data.upvotes} 👎 ${data.data.downvotes}`);
      return data.data.documentId;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Failed to create test article: ${response.status} - ${errorData.message || response.statusText}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating test article:', error.message);
    return null;
  }
}

// Run the function
createTestArticle();
