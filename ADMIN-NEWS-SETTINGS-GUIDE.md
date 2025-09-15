# Admin News Settings System - Complete Guide

## 🎯 Overview

The Admin News Settings System allows administrators to control how many news articles are displayed in the frontend and automatically manage old articles through the Strapi admin dashboard. This system provides both **count-based** and **time-based** filtering with automatic cleanup.

## 🏗️ System Architecture

### Content Type: `news-settings` (Single Type)
- **Location**: `/src/api/news-settings/content-types/news-settings/schema.json`
- **Type**: Single Type (global settings)
- **Access**: Strapi Admin Dashboard → Content Manager → News Settings

### Key Features
1. **Count-based filtering** - Limit total number of articles
2. **Time-based filtering** - Remove articles older than X hours
3. **Flexible cleanup modes** - Choose how articles are deleted
4. **Preservation options** - Protect pinned/breaking news
5. **Automatic cleanup** - Scheduled cleanup based on settings
6. **Statistics tracking** - Monitor cleanup operations

## ⚙️ Admin Settings Fields

### Core Settings
```json
{
  "maxArticleLimit": 21,           // Max articles to keep (5-100)
  "maxArticleAgeHours": 24,        // Max age in hours (1-168)
  "cleanupMode": "both_count_and_age", // How to delete articles
  "cleanupFrequencyMinutes": 60,   // How often to cleanup (15-1440)
  "preservePinnedArticles": true,  // Never delete pinned articles
  "preserveBreakingNews": true     // Never delete breaking news
}
```

### Cleanup Modes
- **`count_only`** - Delete oldest articles if count exceeds limit
- **`age_only`** - Delete articles older than specified hours
- **`both_count_and_age`** - Delete articles that are either too old OR exceed count limit

### Statistics Tracking
```json
{
  "lastCleanupRun": "2025-01-07T20:30:00.000Z",
  "cleanupStats": {
    "totalDeleted": 45,
    "lastDeletedCount": 3,
    "lastCleanupDate": "2025-01-07T20:30:00.000Z"
  }
}
```

## 🚀 API Endpoints

### 1. Get/Update News Settings
```http
GET /api/news-settings
PUT /api/news-settings
```

### 2. Live News Endpoint (Uses Settings)
```http
GET /api/breaking-news/live
```
**Response includes settings in meta:**
```json
{
  "data": [...],
  "pinnedNews": [...],
  "meta": {
    "settings": {
      "maxArticleLimit": 21,
      "maxArticleAgeHours": 24,
      "preservePinned": true,
      "preserveBreaking": true
    }
  }
}
```

### 3. Manual Cleanup Endpoint
```http
POST /api/breaking-news/cleanup
```
**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed: 5 articles deleted",
  "deletedCount": 5,
  "deletedArticles": [...],
  "settings": {...},
  "stats": {...}
}
```

## 🎛️ Admin Dashboard Usage

### Step 1: Access Settings
1. Go to Strapi Admin Dashboard
2. Navigate to **Content Manager**
3. Find **News Settings** (Single Type)
4. Click to edit

### Step 2: Configure Settings
1. **Max Article Limit**: Set how many articles to keep (default: 21)
2. **Max Article Age Hours**: Set maximum age in hours (default: 24)
3. **Cleanup Mode**: Choose deletion strategy
4. **Cleanup Frequency**: How often to run cleanup (default: 60 minutes)
5. **Preserve Options**: Choose what to protect from deletion

### Step 3: Save and Monitor
1. Click **Save** to apply settings
2. Monitor **Last Cleanup Run** and **Cleanup Stats**
3. Use **Manual Cleanup** button if needed

## 🔄 Automatic Cleanup System

### Cron Job Schedule
- **Frequency**: Every 15 minutes (checks if cleanup is needed)
- **Trigger**: Based on `cleanupFrequencyMinutes` setting
- **Method**: Calls the cleanup endpoint automatically

### Cleanup Logic
1. **Check Settings**: Read current admin settings
2. **Calculate Cutoff**: Determine which articles to delete
3. **Apply Filters**: Respect preservation settings
4. **Delete Articles**: Remove old/excess articles
5. **Update Stats**: Record cleanup statistics

### Preservation Rules
- **Pinned Articles**: Never deleted if `preservePinnedArticles: true`
- **Breaking News**: Never deleted if `preserveBreakingNews: true`
- **Hidden Articles**: Always excluded from cleanup
- **Rejected Articles**: Handled by separate daily cleanup

## 📊 Frontend Integration

### Live Endpoint Response
The frontend automatically receives settings in the API response:

```typescript
interface LiveResponse {
  data: NewsItem[];
  pinnedNews: NewsItem[];
  meta: {
    settings: {
      maxArticleLimit: number;
      maxArticleAgeHours: number;
      preservePinned: boolean;
      preserveBreaking: boolean;
    };
  };
}
```

### Frontend Usage
```typescript
// The frontend can use settings for display logic
const { data, pinnedNews, meta } = await fetch('/api/breaking-news/live');
const { settings } = meta;

console.log(`Showing ${data.length} articles (max: ${settings.maxArticleLimit})`);
console.log(`Articles older than ${settings.maxArticleAgeHours} hours are filtered`);
```

## 🧪 Testing the System

### Test Script
Run the comprehensive test:
```bash
node test-admin-news-settings.js
```

### Manual Testing Steps
1. **Update Settings**: Change limits and modes
2. **Check Live Endpoint**: Verify settings are applied
3. **Trigger Cleanup**: Test manual cleanup
4. **Monitor Stats**: Check cleanup statistics
5. **Test Modes**: Try different cleanup modes

## 🔧 Configuration Examples

### High-Volume News Site
```json
{
  "maxArticleLimit": 50,
  "maxArticleAgeHours": 12,
  "cleanupMode": "both_count_and_age",
  "cleanupFrequencyMinutes": 30,
  "preservePinnedArticles": true,
  "preserveBreakingNews": true
}
```

### Low-Volume News Site
```json
{
  "maxArticleLimit": 10,
  "maxArticleAgeHours": 48,
  "cleanupMode": "age_only",
  "cleanupFrequencyMinutes": 120,
  "preservePinnedArticles": true,
  "preserveBreakingNews": false
}
```

### Archive-Heavy Site
```json
{
  "maxArticleLimit": 100,
  "maxArticleAgeHours": 168,
  "cleanupMode": "count_only",
  "cleanupFrequencyMinutes": 240,
  "preservePinnedArticles": true,
  "preserveBreakingNews": true
}
```

## 🚨 Important Notes

### Database Impact
- **Cleanup is permanent** - deleted articles cannot be recovered
- **Statistics are tracked** - monitor cleanup operations
- **Settings are global** - affects all news display

### Performance Considerations
- **Cleanup frequency** - balance between freshness and performance
- **Article limits** - higher limits = more database storage
- **Age settings** - shorter ages = more frequent cleanup

### Best Practices
1. **Start conservative** - use default settings initially
2. **Monitor statistics** - track cleanup effectiveness
3. **Test changes** - verify settings before production
4. **Backup important articles** - pin critical news
5. **Regular monitoring** - check cleanup logs

## 🔍 Troubleshooting

### Common Issues
1. **Settings not applied** - Check if news-settings exists
2. **Cleanup not running** - Verify cron job is active
3. **Articles not deleted** - Check preservation settings
4. **Performance issues** - Adjust cleanup frequency

### Debug Commands
```bash
# Check current settings
curl http://localhost:1337/api/news-settings

# Test manual cleanup
curl -X POST http://localhost:1337/api/breaking-news/cleanup

# Check live endpoint
curl http://localhost:1337/api/breaking-news/live
```

## 📈 Monitoring and Analytics

### Key Metrics
- **Total Articles Deleted**: Track cleanup effectiveness
- **Last Cleanup Run**: Monitor automation
- **Cleanup Frequency**: Optimize performance
- **Preservation Rate**: Monitor protected content

### Logs to Watch
- **Cron job logs**: Check cleanup automation
- **API logs**: Monitor manual operations
- **Error logs**: Track any issues

## 🎯 Benefits

### For Administrators
- **Easy control** - Simple dashboard interface
- **Flexible settings** - Multiple cleanup strategies
- **Real-time monitoring** - Statistics and logs
- **Automatic management** - Set and forget

### For Users
- **Fresh content** - Always relevant news
- **Fast loading** - Optimized article counts
- **Consistent experience** - Predictable content volume

### For System
- **Database efficiency** - Automatic cleanup
- **Performance optimization** - Controlled data volume
- **Scalable architecture** - Handles growth automatically

---

## 🚀 Quick Start

1. **Access Admin Dashboard** → Content Manager → News Settings
2. **Configure your preferences** (start with defaults)
3. **Save settings** and monitor cleanup statistics
4. **Adjust as needed** based on your site's requirements

The system is now ready to automatically manage your news content based on your admin preferences!
