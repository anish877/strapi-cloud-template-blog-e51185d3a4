const Parser = require('rss-parser');

// Test the enhanced RSS parser with image extraction
async function testImageExtraction() {
  console.log('🧪 Testing RSS image extraction...');
  
  // Enhanced parser with custom fields for media extraction
  const parser = new Parser({
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['media:thumbnail', 'mediaThumbnail'],
        ['enclosure', 'enclosure'],
        ['description', 'fullDescription']
      ]
    }
  });
  
  try {
    console.log('📡 Fetching Pattaya Mail RSS feed...');
    const feed = await parser.parseURL('https://www.pattayamail.com/feed');
    
    if (feed && feed.items && feed.items.length > 0) {
      const item = feed.items[0]; // Test first item
      
      console.log(`📰 Testing article: "${item.title}"`);
      
      // Extract featured image using multiple methods
      let featuredImage = null;
      let imageAlt = '';
      
      // Method 1: Check RSS media fields
      if (item.mediaContent && item.mediaContent.url) {
        featuredImage = item.mediaContent.url;
        console.log('🎯 Found image via mediaContent');
      } else if (item.mediaThumbnail && item.mediaThumbnail.url) {
        featuredImage = item.mediaThumbnail.url;
        console.log('🎯 Found image via mediaThumbnail');
      } else if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
        featuredImage = item.enclosure.url;
        console.log('🎯 Found image via enclosure');
      }
      
      // Method 2: Extract from HTML content
      if (!featuredImage) {
        const contentToSearch = item.content || item.description || item.fullDescription || '';
        const imgRegex = /<img[^>]+src="([^">]+)"/i;
        const match = imgRegex.exec(contentToSearch);
        if (match) {
          featuredImage = match[1];
          console.log('🎯 Found image via HTML parsing');
          
          // Extract alt text
          const altRegex = /<img[^>]+alt="([^">]*)"/i;
          const altMatch = altRegex.exec(contentToSearch);
          if (altMatch) {
            imageAlt = altMatch[1];
          }
        }
      }
      
      // Results
      console.log('\n📊 EXTRACTION RESULTS:');
      console.log(`   Title: ${item.title}`);
      console.log(`   Featured Image: ${featuredImage || 'NOT FOUND'}`);
      console.log(`   Image Alt: ${imageAlt || 'NOT FOUND'}`);
      console.log(`   Published: ${item.pubDate}`);
      
      if (featuredImage) {
        console.log('\n✅ SUCCESS: Image extraction working!');
        return true;
      } else {
        console.log('\n❌ FAILED: No image found');
        return false;
      }
    } else {
      console.log('❌ No RSS items found');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testImageExtraction().then(success => {
  console.log(`\n🎯 Test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
});
