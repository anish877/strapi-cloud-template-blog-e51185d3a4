# YouTube Video Widget - Frontend Integration Guide

## 🎯 Overview

This guide provides all the endpoints, data structures, and integration examples needed to implement the YouTube Video Widget in your frontend application.

## 📡 Base Configuration

```javascript
const API_BASE_URL = 'http://localhost:1337/api';
// In production: https://your-domain.com/api
```

## 🔗 Primary Frontend Endpoints

### 1. **Display Set Endpoint** (Main Widget API)
**Primary endpoint for frontend widget integration**

```http
GET /api/videos/display-set?ids=["video_id1","video_id2","video_id3"]
```

**Purpose:** Get curated videos for display with promotion prioritization

**Request Example:**
```javascript
const videoIds = ['YIbbFLRd3cY', '07JgDy7-zaM', 'HtbeuimTI6U'];
const response = await fetch(`${API_BASE_URL}/videos/display-set?ids=${JSON.stringify(videoIds)}`);
const data = await response.json();
```

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "documentId": "ep6x9zp9gm45gegdle8knqh6",
      "video_id": "YIbbFLRd3cY",
      "title": "Places to visit in Thailand | Ultimate 10 Day Itinerary",
      "description": "",
      "thumbnail_url": "https://i.ytimg.com/vi/YIbbFLRd3cY/hqdefault.jpg",
      "channel_name": "Apoorva Rao",
      "video_published_at": "2024-11-04T11:40:49.000Z",
      "duration": "PT35S",
      "view_count": 808141,
      "like_count": 14254,
      "category": "Travel",
      "featured": false,
      "priority": 0,
      "createdAt": "2025-09-13T15:21:30.896Z",
      "is_promoted": true,
      "promotion_expiry": "2025-12-31T23:59:59.000Z",
      "promotion_start": "2025-09-13T18:39:08.886Z",
      "sponsor_name": "Thailand Tourism Board",
      "promotion_active": true
    }
  ],
  "meta": {
    "requested": 3,
    "found": 3,
    "missing": 0
  }
}
```

### 2. **Approved Videos Endpoint**
**Get all approved videos for browsing/selection**

```http
GET /api/featured-videos/approved?page=1&pageSize=12
```

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "documentId": "ep6x9zp9gm45gegdle8knqh6",
      "video_id": "YIbbFLRd3cY",
      "title": "Places to visit in Thailand | Ultimate 10 Day Itinerary",
      "thumbnail_url": "https://i.ytimg.com/vi/YIbbFLRd3cY/hqdefault.jpg",
      "channel_name": "Apoorva Rao",
      "video_published_at": "2024-11-04T11:40:49.000Z",
      "duration": "PT35S",
      "view_count": 808141,
      "like_count": 14254,
      "category": "Travel",
      "createdAt": "2025-09-13T15:21:30.896Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 12,
      "total": 3,
      "pageCount": 1
    }
  }
}
```

### 3. **Promoted Videos Endpoint**
**Get currently promoted/sponsored videos**

```http
GET /api/videos/promoted
```

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "documentId": "s13zhrq2a51z3whcb6t6bt6g",
      "video_id": "07JgDy7-zaM",
      "title": "Why PHUKET Is So Cheap Now",
      "thumbnail_url": "https://i.ytimg.com/vi/07JgDy7-zaM/hqdefault.jpg",
      "channel_name": "Live Love Thailand",
      "is_promoted": true,
      "promotion_start": "2025-09-13T18:39:27.157Z",
      "promotion_expiry": "2025-09-15T00:00:00.000Z",
      "promotion_cost": 50,
      "sponsor_name": "Phuket Hotels Association",
      "status": "active",
      "createdAt": "2025-09-13T15:21:30.887Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 2,
      "pageCount": 1
    }
  }
}
```

## 🎨 Frontend Implementation Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const YouTubeVideoWidget = ({ videoIds, showSponsored = true }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, [videoIds]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/videos/display-set?ids=${JSON.stringify(videoIds)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setVideos(data.data);
      } else {
        setError('Failed to load videos');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration) => {
    // Convert PT35S to 0:35 format
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  if (loading) return <div className="loading">Loading videos...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="youtube-widget">
      {videos.map((video) => (
        <div 
          key={video.video_id} 
          className={`video-card ${video.is_promoted ? 'promoted' : ''}`}
        >
          {video.is_promoted && showSponsored && (
            <div className="sponsored-badge">
              Sponsored by {video.sponsor_name}
            </div>
          )}
          
          <div className="thumbnail-container">
            <img 
              src={video.thumbnail_url} 
              alt={video.title}
              className="thumbnail"
            />
            <div className="duration">{formatDuration(video.duration)}</div>
          </div>
          
          <div className="video-info">
            <h3 className="title">{video.title}</h3>
            <p className="channel">{video.channel_name}</p>
            <div className="stats">
              <span className="views">{formatViewCount(video.view_count)}</span>
              <span className="likes">👍 {video.like_count.toLocaleString()}</span>
              <span className="category">{video.category}</span>
            </div>
          </div>
          
          <a 
            href={`https://youtube.com/watch?v=${video.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="watch-button"
          >
            Watch Video
          </a>
        </div>
      ))}
    </div>
  );
};

export default YouTubeVideoWidget;
```

### CSS Styling Example

```css
.youtube-widget {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.video-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.video-card.promoted {
  border: 2px solid #ff6b35;
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.2);
}

.sponsored-badge {
  background: linear-gradient(45deg, #ff6b35, #f7931e);
  color: white;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  overflow: hidden;
}

.thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.video-info {
  padding: 16px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.channel {
  color: #666;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #888;
  flex-wrap: wrap;
}

.watch-button {
  display: block;
  width: 100%;
  padding: 12px;
  background: #ff0000;
  color: white;
  text-decoration: none;
  text-align: center;
  font-weight: bold;
  transition: background 0.2s;
}

.watch-button:hover {
  background: #cc0000;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #666;
}
```

### JavaScript (Vanilla) Example

```javascript
class YouTubeVideoWidget {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.apiBaseUrl = options.apiBaseUrl || 'http://localhost:1337/api';
    this.showSponsored = options.showSponsored !== false;
  }

  async loadVideos(videoIds) {
    try {
      this.showLoading();
      
      const response = await fetch(
        `${this.apiBaseUrl}/videos/display-set?ids=${JSON.stringify(videoIds)}`
      );
      const data = await response.json();
      
      if (data.success) {
        this.renderVideos(data.data);
      } else {
        this.showError('Failed to load videos');
      }
    } catch (error) {
      this.showError('Network error');
    }
  }

  renderVideos(videos) {
    const html = videos.map(video => `
      <div class="video-card ${video.is_promoted ? 'promoted' : ''}">
        ${video.is_promoted && this.showSponsored ? 
          `<div class="sponsored-badge">Sponsored by ${video.sponsor_name}</div>` : ''
        }
        
        <div class="thumbnail-container">
          <img src="${video.thumbnail_url}" alt="${video.title}" class="thumbnail">
          <div class="duration">${this.formatDuration(video.duration)}</div>
        </div>
        
        <div class="video-info">
          <h3 class="title">${video.title}</h3>
          <p class="channel">${video.channel_name}</p>
          <div class="stats">
            <span class="views">${this.formatViewCount(video.view_count)}</span>
            <span class="likes">👍 ${video.like_count.toLocaleString()}</span>
            <span class="category">${video.category}</span>
          </div>
        </div>
        
        <a href="https://youtube.com/watch?v=${video.video_id}" 
           target="_blank" 
           rel="noopener noreferrer" 
           class="watch-button">
          Watch Video
        </a>
      </div>
    `).join('');
    
    this.container.innerHTML = `<div class="youtube-widget">${html}</div>`;
  }

  formatDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  formatViewCount(count) {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  }

  showLoading() {
    this.container.innerHTML = '<div class="loading">Loading videos...</div>';
  }

  showError(message) {
    this.container.innerHTML = `<div class="error">${message}</div>`;
  }
}

// Usage
const widget = new YouTubeVideoWidget('video-container', {
  apiBaseUrl: 'http://localhost:1337/api',
  showSponsored: true
});

widget.loadVideos(['YIbbFLRd3cY', '07JgDy7-zaM', 'HtbeuimTI6U']);
```

## 🔧 Advanced Integration Options

### 1. **Dynamic Video Loading**

```javascript
// Load approved videos dynamically
async function loadApprovedVideos(page = 1, pageSize = 12) {
  const response = await fetch(
    `${API_BASE_URL}/featured-videos/approved?page=${page}&pageSize=${pageSize}`
  );
  return await response.json();
}

// Load promoted videos
async function loadPromotedVideos() {
  const response = await fetch(`${API_BASE_URL}/videos/promoted`);
  return await response.json();
}
```

### 2. **Widget Configuration Options**

```javascript
const widgetConfig = {
  // Display options
  showSponsored: true,
  showViewCount: true,
  showLikes: true,
  showDuration: true,
  showCategory: true,
  
  // Layout options
  gridColumns: 'auto-fit',
  minCardWidth: '300px',
  maxVideos: 6,
  
  // Behavior options
  openInNewTab: true,
  autoRefresh: false,
  refreshInterval: 300000, // 5 minutes
  
  // Styling options
  theme: 'light', // 'light' | 'dark'
  accentColor: '#ff6b35',
  borderRadius: '12px'
};
```

### 3. **Error Handling**

```javascript
const handleApiError = (error, response) => {
  if (response?.status === 404) {
    return 'Videos not found';
  } else if (response?.status >= 500) {
    return 'Server error. Please try again later.';
  } else if (!navigator.onLine) {
    return 'No internet connection';
  }
  return 'Failed to load videos';
};
```

## 📊 Data Structure Reference

### Video Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Database ID |
| `documentId` | string | Strapi document ID |
| `video_id` | string | YouTube video ID |
| `title` | string | Video title |
| `description` | string | Video description |
| `thumbnail_url` | string | Video thumbnail URL |
| `channel_name` | string | YouTube channel name |
| `channel_id` | string | YouTube channel ID |
| `video_published_at` | string | ISO date string |
| `duration` | string | ISO 8601 duration (PT35S) |
| `view_count` | number | YouTube view count |
| `like_count` | number | YouTube like count |
| `category` | string | Video category |
| `featured` | boolean | Is featured video |
| `priority` | number | Display priority |
| `status` | string | 'active', 'pending', 'rejected' |
| `is_promoted` | boolean | Is sponsored/promoted |
| `promotion_start` | string | Promotion start date |
| `promotion_expiry` | string | Promotion end date |
| `promotion_cost` | number | Promotion cost |
| `sponsor_name` | string | Sponsor company name |
| `sponsor_contact` | string | Sponsor contact info |
| `promotion_active` | boolean | Is promotion currently active |
| `createdAt` | string | Record creation date |

## 🚀 Production Deployment Notes

### Environment Variables
```bash
# Backend API URL
REACT_APP_API_URL=https://your-api-domain.com/api
# or
VUE_APP_API_URL=https://your-api-domain.com/api
```

### CORS Configuration
Ensure your Strapi backend allows requests from your frontend domain:

```javascript
// config/middlewares.js
module.exports = [
  // ...
  {
    name: 'strapi::cors',
    config: {
      origin: ['https://your-frontend-domain.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  },
  // ...
];
```

### Performance Optimization
- Implement caching for video data (5-10 minutes)
- Use lazy loading for thumbnails
- Implement pagination for large video lists
- Consider using a CDN for thumbnail images

## 🔒 Security Considerations

1. **API Rate Limiting**: Implement client-side rate limiting
2. **Input Validation**: Validate video IDs before API calls
3. **XSS Prevention**: Sanitize video titles and descriptions
4. **HTTPS Only**: Use HTTPS in production
5. **Content Security Policy**: Configure CSP headers

## 📱 Mobile Responsiveness

```css
@media (max-width: 768px) {
  .youtube-widget {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
  
  .video-card {
    max-width: 100%;
  }
  
  .title {
    font-size: 14px;
  }
  
  .stats {
    font-size: 11px;
  }
}
```

This comprehensive guide provides everything needed to integrate the YouTube Video Widget into any frontend application with full support for promoted content, responsive design, and production-ready features.
