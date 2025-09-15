const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::local-search.local-search', ({ strapi }) => ({
  // Search across all content types
  async searchAll(query, options = {}) {
    const { contentType, limit = 20, page = 1 } = options;
    const searchResults = [];
    
    // Get all available content types
    const contentTypes = this.getSearchableContentTypes();
    const typesToSearch = contentType ? [contentType] : contentTypes;
    
    for (const type of typesToSearch) {
      try {
        const results = await this.searchContentType(type, query, limit);
        searchResults.push(...results);
      } catch (error) {
        strapi.log.warn(`Search error for ${type}:`, error.message);
      }
    }
    
    // Sort by relevance and apply pagination
    const sortedResults = this.sortByRelevance(searchResults, query);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return sortedResults.slice(startIndex, endIndex);
  },

  // Search specific content type
  async searchContentType(contentType, query, limit = 20) {
    const searchableFields = this.getSearchableFields(contentType);
    const filters = this.buildSearchFilters(searchableFields, query);
    
    try {
      const entities = await strapi.entityService.findMany(`api::${contentType}.${contentType}`, {
        filters,
        populate: '*',
        limit,
        sort: { createdAt: 'desc' }
      });

      return entities.map(entity => this.formatSearchResult(entity, contentType, query));
    } catch (error) {
      strapi.log.error(`Error searching ${contentType}:`, error);
      return [];
    }
  },

  // Get searchable content types
  getSearchableContentTypes() {
    return [
      'breaking-news',
      'sponsored-post', 
      'news-source',
      'author',
      'category',
      'advertisement',
      'business',
      'business-spotlight',
      'deal',
      'event',
      'live-event',
      'photo-gallery',
      'radio-station',
      'review',
      'social-media-post',
      'traffic-incident',
      'trending-topic',
      'youtube-video',
      'flight-tracker',
      'weather',
      'booking',
      'forum-activity'
    ];
  },

  // Get searchable fields for content type
  getSearchableFields(contentType) {
    const fieldMappings = {
      'breaking-news': ['Title', 'Content', 'Summary', 'Tags'],
      'sponsored-post': ['Title', 'Content', 'Summary', 'Tags', 'SponsorName'],
      'news-source': ['Name', 'Description', 'URL'],
      'author': ['Name', 'Bio', 'Email'],
      'category': ['Name', 'Description'],
      'advertisement': ['Title', 'Description', 'CompanyName'],
      'business': ['Name', 'Description', 'Address', 'Phone'],
      'business-spotlight': ['BusinessName', 'Description', 'Services'],
      'deal': ['Title', 'Description', 'BusinessName'],
      'event': ['Title', 'Description', 'Location', 'Organizer'],
      'live-event': ['Title', 'Description', 'Location'],
      'photo-gallery': ['Title', 'Description', 'Location'],
      'radio-station': ['Name', 'Description', 'Genre'],
      'review': ['Title', 'Content', 'BusinessName'],
      'social-media-post': ['Content', 'Platform'],
      'traffic-incident': ['Title', 'Description', 'Location'],
      'trending-topic': ['Topic', 'Description'],
      'youtube-video': ['Title', 'Description', 'ChannelName'],
      'flight-tracker': ['FlightNumber', 'Airline', 'OriginAirport', 'DestinationAirport'],
      'weather': ['Location', 'Description'],
      'booking': ['ServiceName', 'Description', 'Location'],
      'forum-activity': ['Title', 'Content', 'Author']
    };

    return fieldMappings[contentType] || ['Title', 'Name', 'Description', 'Content'];
  },

  // Build search filters
  buildSearchFilters(fields, query) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
    
    return {
      $or: fields.flatMap(field => 
        searchTerms.map(term => ({
          [field]: {
            $containsi: term
          }
        }))
      )
    };
  },

  // Format search result
  formatSearchResult(entity, contentType, query) {
    const searchableFields = this.getSearchableFields(contentType);
    const relevanceScore = this.calculateRelevance(entity, searchableFields, query);
    
    return {
      id: entity.id,
      documentId: entity.documentId,
      contentType,
      title: this.extractTitle(entity, contentType),
      snippet: this.extractSnippet(entity, searchableFields, query),
      url: this.generateUrl(entity, contentType),
      relevanceScore,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      data: entity
    };
  },

  // Extract title from entity
  extractTitle(entity, contentType) {
    const titleFields = ['Title', 'Name', 'FlightNumber', 'Topic', 'ServiceName'];
    
    for (const field of titleFields) {
      if (entity[field]) {
        return entity[field];
      }
    }
    
    return `${contentType} #${entity.id}`;
  },

  // Extract snippet from entity
  extractSnippet(entity, fields, query, maxLength = 200) {
    const queryTerms = query.toLowerCase().split(' ');
    
    for (const field of fields) {
      if (entity[field] && typeof entity[field] === 'string') {
        const content = entity[field];
        const lowerContent = content.toLowerCase();
        
        // Find the first occurrence of any query term
        let bestIndex = -1;
        for (const term of queryTerms) {
          const index = lowerContent.indexOf(term);
          if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
            bestIndex = index;
          }
        }
        
        if (bestIndex !== -1) {
          const start = Math.max(0, bestIndex - 50);
          const end = Math.min(content.length, start + maxLength);
          let snippet = content.substring(start, end);
          
          if (start > 0) snippet = '...' + snippet;
          if (end < content.length) snippet = snippet + '...';
          
          return snippet;
        }
      }
    }
    
    // Fallback to first available text field
    for (const field of fields) {
      if (entity[field] && typeof entity[field] === 'string') {
        const content = entity[field];
        return content.length > maxLength 
          ? content.substring(0, maxLength) + '...'
          : content;
      }
    }
    
    return 'No description available';
  },

  // Generate URL for entity
  generateUrl(entity, contentType) {
    const baseUrl = strapi.config.get('server.url', 'http://localhost:1337');
    return `${baseUrl}/api/${contentType}s/${entity.documentId || entity.id}`;
  },

  // Calculate relevance score
  calculateRelevance(entity, fields, query) {
    const queryTerms = query.toLowerCase().split(' ');
    let score = 0;
    
    for (const field of fields) {
      if (entity[field] && typeof entity[field] === 'string') {
        const content = entity[field].toLowerCase();
        
        for (const term of queryTerms) {
          const occurrences = (content.match(new RegExp(term, 'g')) || []).length;
          
          // Weight by field importance and term frequency
          const fieldWeight = field === 'Title' || field === 'Name' ? 3 : 1;
          score += occurrences * fieldWeight;
        }
      }
    }
    
    return score;
  },

  // Sort results by relevance
  sortByRelevance(results, query) {
    return results.sort((a, b) => {
      // Primary sort: relevance score
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Secondary sort: recency
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  },

  // Get search suggestions
  async getSuggestions(query, limit = 5) {
    const suggestions = new Set();
    const queryLower = query.toLowerCase();
    
    // Get suggestions from breaking news titles
    try {
      const breakingNews = await strapi.entityService.findMany('api::breaking-news.breaking-news', {
        fields: ['Title'],
        limit: 50
      });
      
      breakingNews.forEach(item => {
        if (item.Title && item.Title.toLowerCase().includes(queryLower)) {
          const words = item.Title.split(' ');
          words.forEach(word => {
            if (word.toLowerCase().startsWith(queryLower) && word.length > 2) {
              suggestions.add(word);
            }
          });
        }
      });
    } catch (error) {
      strapi.log.warn('Error getting suggestions from breaking news:', error);
    }
    
    // Get suggestions from trending topics
    try {
      const trendingTopics = await strapi.entityService.findMany('api::trending-topic.trending-topic', {
        fields: ['Topic'],
        limit: 20
      });
      
      trendingTopics.forEach(item => {
        if (item.Topic && item.Topic.toLowerCase().includes(queryLower)) {
          suggestions.add(item.Topic);
        }
      });
    } catch (error) {
      strapi.log.warn('Error getting suggestions from trending topics:', error);
    }
    
    return Array.from(suggestions).slice(0, limit);
  },

  // Get available content types with counts
  async getAvailableContentTypes() {
    const contentTypes = this.getSearchableContentTypes();
    const result = [];
    
    for (const type of contentTypes) {
      try {
        const count = await strapi.entityService.count(`api::${type}.${type}`);
        result.push({
          name: type,
          displayName: this.formatDisplayName(type),
          count
        });
      } catch (error) {
        strapi.log.warn(`Error counting ${type}:`, error);
      }
    }
    
    return result.filter(item => item.count > 0);
  },

  // Format display name
  formatDisplayName(contentType) {
    return contentType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  // Reindex all content
  async reindexAll() {
    const contentTypes = this.getSearchableContentTypes();
    let indexed = 0;
    let errors = 0;
    
    for (const type of contentTypes) {
      try {
        const count = await strapi.entityService.count(`api::${type}.${type}`);
        indexed += count;
        strapi.log.info(`Indexed ${count} items from ${type}`);
      } catch (error) {
        errors++;
        strapi.log.error(`Error indexing ${type}:`, error);
      }
    }
    
    return { indexed, errors, timestamp: new Date().toISOString() };
  },

  // Get search statistics
  async getSearchStats() {
    const contentTypes = this.getSearchableContentTypes();
    const stats = {
      totalContentTypes: contentTypes.length,
      contentTypeCounts: {},
      totalItems: 0,
      lastUpdated: new Date().toISOString()
    };
    
    for (const type of contentTypes) {
      try {
        const count = await strapi.entityService.count(`api::${type}.${type}`);
        stats.contentTypeCounts[type] = count;
        stats.totalItems += count;
      } catch (error) {
        stats.contentTypeCounts[type] = 0;
        strapi.log.warn(`Error getting count for ${type}:`, error);
      }
    }
    
    return stats;
  }
}));
