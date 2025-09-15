# News Sources Setup Guide

## 🎯 Current Status

✅ **Strapi Server**: Running at http://localhost:1337/
✅ **News Articles API**: Working (`/api/news-articles`)
❌ **News Sources API**: Not available (`/api/news-sources` returns 404)

## 🔍 Issue Analysis

The news-source content type exists in the codebase but the API endpoint is not accessible. This indicates that:

1. The content type is not published in the admin panel
2. The API routes need to be deployed
3. The content type configuration needs to be updated

## 🚀 Solutions

### Option 1: Admin Panel Configuration (Recommended)

1. **Access Admin Panel**
   - Go to: http://localhost:1337/admin
   - Login with your admin credentials

2. **Publish News Source Content Type**
   - Navigate to: **Content Manager** → **Content Types Builder**
   - Find the **News Source** content type
   - Ensure it's published and configured properly
   - Check that all required fields are set up

3. **Verify API Routes**
   - Go to: **Settings** → **Users & Permissions Plugin** → **Roles** → **Public**
   - Ensure **News Source** has appropriate permissions (find, findOne, create, update, delete)

### Option 2: Redeploy with API Routes

If the content type is not showing in admin panel:

1. **Redeploy the Application**
   ```bash
   # The API routes have been created in the codebase:
   # - src/api/news-source/routes/news-source.js
   # - src/api/news-source/controllers/news-source.js  
   # - src/api/news-source/services/news-source.js
   ```

2. **Restart Strapi Server**
   - The new routes should be available after restart

### Option 3: Manual Database Creation

If API is not working, create news sources directly in database:

```sql
-- Example SQL for creating news sources
INSERT INTO news_sources (name, description, source_type, url, is_active, priority, check_interval, tags, created_at, updated_at, published_at) VALUES
('Pattaya Mail', 'Leading English-language newspaper in Pattaya', 'rss', 'https://www.pattayamail.com/rss.xml', true, 1, 300, '["pattaya", "local", "english", "news"]', NOW(), NOW(), NOW()),
('The Nation Thailand', 'Major English-language daily newspaper', 'rss', 'https://www.nationthailand.com/rss.xml', true, 1, 300, '["thailand", "english", "national", "news"]', NOW(), NOW(), NOW()),
('Bangkok Post', 'Leading English-language newspaper in Thailand', 'rss', 'https://www.bangkokpost.com/rss/data/topstories.xml', true, 1, 300, '["thailand", "bangkok", "english", "news"]', NOW(), NOW(), NOW());
```

## 📡 News Sources to Create

The following news sources have been prepared for Pattaya/Thailand:

| Name | Type | URL | Priority | Tags |
|------|------|-----|----------|------|
| Pattaya Mail | RSS | https://www.pattayamail.com/rss.xml | 1 | pattaya, local, english |
| The Nation Thailand | RSS | https://www.nationthailand.com/rss.xml | 1 | thailand, english, national |
| Bangkok Post | RSS | https://www.bangkokpost.com/rss/data/topstories.xml | 1 | thailand, bangkok, english |
| Thai PBS World | RSS | https://www.thaipbsworld.com/rss/ | 2 | thailand, international, english |
| Pattaya One | RSS | https://pattayaone.net/feed/ | 2 | pattaya, local, events |
| Pattaya Today | RSS | https://www.pattayatoday.net/feed/ | 3 | pattaya, local |
| Chonburi News | RSS | https://www.chonburinews.com/feed/ | 3 | chonburi, pattaya, provincial |
| Thailand News | RSS | https://www.thailandnews.net/feed/ | 4 | thailand, general |
| Pattaya News | RSS | https://www.pattayanews.net/feed/ | 4 | pattaya, local, updates |
| Thai Visa News | RSS | https://www.thaivisa.com/forum/forum/1-thailand-news/feed/ | 5 | thailand, expat, visa |

## 🔧 Content Type Schema

The news-source content type has the following fields:

```json
{
  "name": "string (required, unique)",
  "description": "text",
  "sourceType": "enumeration (website, rss, api, manual)",
  "url": "string (required)",
  "isActive": "boolean (default: true)",
  "priority": "integer (1-10, default: 1)",
  "lastChecked": "datetime",
  "checkInterval": "integer (min: 60, default: 300)",
  "tags": "json"
}
```

## 🧪 Testing

Once the API is working, test with:

```bash
# Test GET endpoint
curl "http://localhost:1337/api/news-sources"

# Test POST endpoint
curl -X POST "http://localhost:1337/api/news-sources" \
  -H "Content-Type: application/json" \
  -d '{"data":{"name":"Test Source","url":"https://example.com","sourceType":"rss","isActive":true}}'
```

## 🚀 Next Steps

1. **Fix the API endpoint** using one of the solutions above
2. **Run the population script**:
   ```bash
   node populate-news-sources-production.js
   ```
3. **Start the news scheduler**:
   ```bash
   npm run news:start
   ```

## 📋 Files Created

The following files have been created to support news sources:

- `src/api/news-source/routes/news-source.js` - API routes
- `src/api/news-source/controllers/news-source.js` - Controller logic
- `src/api/news-source/services/news-source.js` - Service logic
- `populate-news-sources-production.js` - Population script
- `populate-news-sources.js` - Local development script

## 🎯 Success Criteria

✅ News sources API endpoint accessible at `/api/news-sources`
✅ News sources can be created via API
✅ News scheduler can fetch from configured sources
✅ News articles are automatically populated

---

**Note**: The news source population script is ready to run once the API endpoint is available. All necessary code has been created and the script will automatically populate 10 high-quality news sources for Pattaya/Thailand coverage.
