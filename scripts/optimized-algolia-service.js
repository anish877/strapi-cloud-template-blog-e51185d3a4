require('dotenv').config();
const algoliasearch = require('algoliasearch');
const axios = require('axios');

class OptimizedAlgoliaService {
  constructor() {
    // Initialize Algolia client
    this.client = algoliasearch(
      process.env.ALGOLIA_APP_ID || 'your-app-id',
      process.env.ALGOLIA_API_KEY || 'your-admin-api-key'
    );

    this.strapiBaseUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    
    // Single unified index for all content types
    this.unifiedIndex = this.client.initIndex('unified_search');
    
    // Define all content types with their configurations
    this.contentTypes = {
      // News & Content
      'breaking-news': { 
        endpoint: 'breaking-news-plural',
        searchableFields: ['Title', 'Summary', 'Category', 'Source'],
        facetFields: ['Severity', 'Category', 'Source', 'IsBreaking']
      },
      'sponsored-post': { 
        endpoint: 'sponsored-posts',
        searchableFields: ['Title', 'Summary', 'SponsorName'],
        facetFields: ['SponsorName', 'IsActive', 'Priority']
      },
      'news-source': { 
        endpoint: 'news-sources',
        searchableFields: ['name', 'description', 'sourceType'],
        facetFields: ['sourceType', 'isActive', 'priority']
      },
      'review': { 
        endpoint: 'reviews',
        searchableFields: ['title', 'content', 'author', 'business', 'category'],
        facetFields: ['category', 'rating', 'verified', 'location']
      },
      
      // Business & Commerce
      'business': { 
        endpoint: 'businesses',
        searchableFields: ['name', 'description', 'category', 'location'],
        facetFields: ['category', 'location', 'status', 'featured']
      },
      'advertisement': { 
        endpoint: 'advertisements',
        searchableFields: ['title', 'description', 'advertiser'],
        facetFields: ['advertiser', 'status', 'placement']
      },
      'deal': { 
        endpoint: 'deals',
        searchableFields: ['title', 'description', 'business', 'category'],
        facetFields: ['category', 'business', 'status', 'featured']
      },
      
      // Events & Activities
      'event': { 
        endpoint: 'events',
        searchableFields: ['title', 'description', 'location', 'organizer'],
        facetFields: ['category', 'location', 'status', 'featured']
      },
      'live-event': { 
        endpoint: 'live-events',
        searchableFields: ['title', 'description', 'venue', 'performer'],
        facetFields: ['category', 'venue', 'status']
      },
      
      // Media & Entertainment
      'radio-station': { 
        endpoint: 'radio-stations',
        searchableFields: ['name', 'description', 'genre', 'frequency'],
        facetFields: ['genre', 'language', 'status']
      },
      'youtube-video': { 
        endpoint: 'youtube-videos',
        searchableFields: ['title', 'description', 'channel', 'tags'],
        facetFields: ['channel', 'category', 'status']
      },
      
      // Content & Community
      'author': { 
        endpoint: 'authors',
        searchableFields: ['name', 'bio', 'expertise'],
        facetFields: ['expertise', 'status', 'featured']
      },
      'category': { 
        endpoint: 'categories',
        searchableFields: ['name', 'description'],
        facetFields: ['type', 'parent', 'status']
      },
      'photo-gallery': { 
        endpoint: 'photo-galleries',
        searchableFields: ['title', 'description', 'photographer', 'location'],
        facetFields: ['category', 'location', 'photographer', 'featured']
      },
      
      // Flight Tracking
      'flight-tracker': { 
        endpoint: 'flight-trackers',
        searchableFields: ['FlightNumber', 'Airline', 'AirportName', 'OriginAirport', 'DestinationAirport', 'Terminal', 'Gate'],
        facetFields: ['Airport', 'FlightType', 'FlightStatus', 'Airline', 'Terminal']
      },
      
      // Video Content
      'video': { 
        endpoint: 'videos',
        searchableFields: ['title', 'description', 'channel_name', 'category', 'video_id'],
        facetFields: ['videostatus', 'category', 'channel_name', 'is_promoted', 'featured']
      }
    };
  }

  // Configure unified index with comprehensive settings
  async configureIndex() {
    console.log('🔧 Configuring unified Algolia index...');
    
    try {
      await this.unifiedIndex.setSettings({
        searchableAttributes: [
          'title',
          'content', 
          'summary',
          'description',
          'category',
          'source',
          'author',
          'name',
          'tags'
        ],
        attributesForFaceting: [
          'filterOnly(contentType)',
          'filterOnly(category)', 
          'filterOnly(source)',
          'filterOnly(severity)',
          'filterOnly(isActive)',
          'filterOnly(priority)',
          'filterOnly(status)',
          'filterOnly(featured)'
        ],
        customRanking: [
          'desc(publishedAt)', 
          'desc(createdAt)', 
          'desc(priority)',
          'desc(isBreaking)'
        ],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
        snippetEllipsisText: '...',
        hitsPerPage: 20,
        maxValuesPerFacet: 100
      });
      
      console.log('   ✅ Configured unified_search index');
    } catch (error) {
      console.log('   ❌ Error configuring unified index:', error.message);
      throw error;
    }
  }

  // Extract searchable text from item based on configured fields
  extractSearchableText(item, searchableFields) {
    return searchableFields
      .map(field => {
        const value = this.getNestedValue(item, field);
        return typeof value === 'string' ? value : '';
      })
      .filter(text => text.length > 0)
      .join(' ');
  }

  // Get nested object value by dot notation
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  // Normalize item data for unified index
  normalizeItemForSearch(item, contentType, config) {
    const normalized = {
      objectID: `${contentType}_${item.documentId || item.id}`,
      contentType: contentType,
      id: item.documentId || item.id,
      title: item.Title || item.title || item.name || '',
      content: item.Summary || item.summary || item.description || item.content || '',
      category: item.Category || item.category || '',
      source: item.Source || item.source || '',
      author: item.author?.name || item.Author || '',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
      searchableText: this.extractSearchableText(item, config.searchableFields)
    };

    // Add content-type specific fields
    if (contentType === 'breaking-news') {
      normalized.severity = item.Severity;
      normalized.isBreaking = item.IsBreaking;
      normalized.priority = item.IsBreaking ? 10 : 5;
    } else if (contentType === 'sponsored-post') {
      normalized.sponsorName = item.SponsorName;
      normalized.isActive = item.IsActive;
      normalized.priority = item.Priority || 1;
    } else if (contentType === 'event') {
      normalized.location = item.location;
      normalized.startDate = item.startDate;
      normalized.endDate = item.endDate;
    } else if (contentType === 'video') {
      normalized.videoId = item.video_id;
      normalized.channelName = item.channel_name;
      normalized.videostatus = item.videostatus;
      normalized.viewCount = item.view_count || 0;
      normalized.duration = item.duration;
      normalized.thumbnailUrl = item.thumbnail_url;
      normalized.isPromoted = item.is_promoted || false;
      normalized.featured = item.featured || false;
    } else if (contentType === 'review') {
      normalized.rating = item.rating;
      normalized.author = item.author;
      normalized.business = item.business;
      normalized.verified = item.verified;
      normalized.helpful = item.helpful || 0;
    }

    // Add facet fields
    config.facetFields?.forEach(field => {
      const cleanField = field.replace('filterOnly(', '').replace(')', '');
      if (item[field] !== undefined) {
        normalized[cleanField] = item[field];
      }
    });

    return normalized;
  }

  // Index all content types to unified index
  async indexAllContent() {
    console.log('📚 Starting comprehensive content indexing...');
    let totalIndexed = 0;
    const allObjects = [];

    for (const [contentType, config] of Object.entries(this.contentTypes)) {
      try {
        console.log(`📝 Fetching ${contentType}...`);
        
        const response = await axios.get(`${this.strapiBaseUrl}/api/${config.endpoint}?populate=*&pagination[limit]=1000`);
        const items = response.data.data;

        if (!items || items.length === 0) {
          console.log(`   No ${contentType} items found`);
          continue;
        }

        const normalizedItems = items.map(item => 
          this.normalizeItemForSearch(item, contentType, config)
        );

        allObjects.push(...normalizedItems);
        console.log(`   ✅ Prepared ${normalizedItems.length} ${contentType} items`);
        totalIndexed += normalizedItems.length;

      } catch (error) {
        console.log(`   ❌ Error fetching ${contentType}:`, error.message);
      }
    }

    // Batch index all objects to unified index
    if (allObjects.length > 0) {
      console.log(`🚀 Indexing ${allObjects.length} total items to unified index...`);
      
      try {
        await this.unifiedIndex.saveObjects(allObjects);
        console.log(`   ✅ Successfully indexed ${allObjects.length} items`);
      } catch (error) {
        console.log(`   ❌ Error indexing to unified index:`, error.message);
        throw error;
      }
    }

    return totalIndexed;
  }

  // Add or update single item in unified index
  async addItem(item) {
    try {
      // Handle both old and new calling patterns
      let contentType, itemData;
      
      if (typeof item === 'object' && item.type) {
        // New pattern: item object with type property
        contentType = item.type;
        itemData = item;
      } else if (arguments.length === 2) {
        // Old pattern: addItem(contentType, item)
        contentType = arguments[0];
        itemData = arguments[1];
      } else {
        console.log(`⚠️  Invalid addItem call pattern`);
        return false;
      }

      const config = this.contentTypes[contentType];
      if (!config) {
        console.log(`⚠️  Unknown content type: ${contentType}`);
        return false;
      }

      const normalizedItem = this.normalizeItemForSearch(itemData, contentType, config);
      await this.unifiedIndex.saveObject(normalizedItem);
      
      console.log(`✅ Added/updated ${contentType} item: ${normalizedItem.title || normalizedItem.objectID}`);
      return true;
    } catch (error) {
      console.log(`❌ Error adding item:`, error.message);
      return false;
    }
  }

  // Alias for lifecycle compatibility
  async indexSingleItem(contentType, item) {
    return await this.addItem(contentType, item);
  }

  // Delete item from unified index
  async deleteItem(contentType, itemId) {
    try {
      const objectID = `${contentType}_${itemId}`;
      await this.unifiedIndex.deleteObject(objectID);
      
      console.log(`✅ Deleted ${contentType} item: ${itemId}`);
      return true;
    } catch (error) {
      console.log(`❌ Error deleting ${contentType} item:`, error.message);
      return false;
    }
  }

  // Search across all content types
  async search(query, options = {}) {
    try {
      const searchOptions = {
        hitsPerPage: options.hitsPerPage || options.limit || 20,
        page: options.page || 0,
        filters: options.filters || '',
        facetFilters: options.facetFilters || [],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>'
      };

      // Add content type filter if specified
      if (options.contentType) {
        const contentTypeFilter = `contentType:${options.contentType}`;
        searchOptions.filters = searchOptions.filters 
          ? `${searchOptions.filters} AND ${contentTypeFilter}`
          : contentTypeFilter;
      }

      const results = await this.unifiedIndex.search(query, searchOptions);
      
      return {
        hits: results.hits,
        nbHits: results.nbHits,
        page: results.page,
        nbPages: results.nbPages,
        hitsPerPage: results.hitsPerPage,
        facets: results.facets || {}
      };
    } catch (error) {
      console.log('❌ Search error:', error);
      throw error;
    }
  }

  // Get search suggestions for autocomplete
  async getSuggestions(query, options = {}) {
    try {
      const results = await this.search(query, {
        limit: options.limit || 5,
        filters: options.filters
      });

      return results.hits.map(hit => ({
        title: hit.title,
        contentType: hit.contentType,
        category: hit.category,
        objectID: hit.objectID
      }));
    } catch (error) {
      console.log('❌ Suggestions error:', error);
      return [];
    }
  }

  // Get available facets for filtering UI
  async getFacets(query = '') {
    try {
      const results = await this.unifiedIndex.search(query, {
        hitsPerPage: 0,
        facets: ['contentType', 'category', 'source', 'severity', 'status']
      });

      return results.facets || {};
    } catch (error) {
      console.log('❌ Facets error:', error);
      return {};
    }
  }

  // Clear all data from unified index
  async clearIndex() {
    try {
      await this.unifiedIndex.clearObjects();
      console.log('✅ Cleared unified index');
      return true;
    } catch (error) {
      console.log('❌ Error clearing index:', error.message);
      return false;
    }
  }
}

module.exports = OptimizedAlgoliaService;
