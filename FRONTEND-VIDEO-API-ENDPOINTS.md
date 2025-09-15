# Frontend Video API Endpoints

## Base URL
```
http://localhost:1337
```

## Video Management Endpoints

### 1. Get All Videos
```http
GET /api/videos
```
**Response:**
```json
{
  "data": [
    {
      "id": 8,
      "documentId": "ep6x9zp9gm45gegdle8knqh6",
      "video_id": "YIbbFLRd3cY",
      "title": "Places to visit in Thailand | Ultimate 10 Day Itinerary",
      "thumbnail_url": "https://i.ytimg.com/vi/YIbbFLRd3cY/hqdefault.jpg",
      "channel_name": "Apoorva Rao",
      "videostatus": "active",
      "description": "",
      "duration": "PT35S",
      "view_count": 808141,
      "like_count": 14254,
      "channel_id": "UCR6YPyVyMgBE3lUsznemoLQ",
      "video_published_at": "2024-11-04T11:40:49.000Z",
      "category": "Travel",
      "createdAt": "2025-09-13T15:21:30.896Z",
      "updatedAt": "2025-09-13T21:29:10.804Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 5
    }
  }
}
```

### 2. Get Single Video
```http
GET /api/videos/{documentId}
```
**Example:**
```http
GET /api/videos/ep6x9zp9gm45gegdle8knqh6
```

### 3. Get Videos by Status
```http
GET /api/videos?filters[videostatus][$eq]=active
GET /api/videos?filters[videostatus][$eq]=pending
GET /api/videos?filters[videostatus][$eq]=rejected
GET /api/videos?filters[videostatus][$eq]=archived
```

### 4. Get Active Videos Only (For Frontend Display)
```http
GET /api/featured-videos/approved
```
**Query Parameters:**
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 12)
- `sort` - Sort order (default: createdAt:desc)
- `category` - Filter by category
- `search` - Search in title, description, channel

**Example:**
```http
GET /api/featured-videos/approved?page=1&pageSize=6&category=Travel&search=thailand
```

### 5. Get Display Set (For Homepage Widget)
```http
GET /api/videos/display-set?ids=["video1","video2","video3"]
```
**Example:**
```http
GET /api/videos/display-set?ids=["YIbbFLRd3cY","07JgDy7-zaM","HtbeuimTI6U"]
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "video_id": "YIbbFLRd3cY",
      "title": "Places to visit in Thailand",
      "thumbnail_url": "https://i.ytimg.com/vi/YIbbFLRd3cY/hqdefault.jpg",
      "channel_name": "Apoorva Rao",
      "videostatus": "active",
      "is_promoted": false,
      "promotion_active": false,
      "priority": 0
    }
  ],
  "meta": {
    "requested": 3,
    "found": 1,
    "missing": 2
  }
}
```

## Video Statistics Endpoints

### 6. Get Moderation Statistics
```http
GET /api/featured-videos/moderation/stats
```
**Response:**
```json
{
  "success": true,
  "stats": {
    "pending": 2,
    "active": 1,
    "rejected": 1,
    "total": 5,
    "approval_rate": "50.0"
  },
  "recent_activity": [
    {
      "video_id": "YIbbFLRd3cY",
      "title": "Places to visit in Thailand",
      "videostatus": "active",
      "moderated_at": "2025-09-13T21:29:10.804Z"
    }
  ]
}
```

### 7. Get Videos Pending Review
```http
GET /api/featured-videos/moderation/pending
```
**Query Parameters:**
- `page` - Page number
- `pageSize` - Items per page
- `sort` - Sort order

## Video Promotion Endpoints

### 8. Get Promoted Videos
```http
GET /api/videos/promoted
```
**Query Parameters:**
- `page` - Page number
- `pageSize` - Items per page
- `includeExpired` - Include expired promotions (default: false)

### 9. Promote Video (Admin Only)
```http
PUT /api/videos/promote/{id}
```
**Body:**
```json
{
  "promotion_expiry": "2024-12-31T23:59:59.000Z",
  "promotion_cost": 100.00,
  "sponsor_name": "Tourism Thailand",
  "sponsor_contact": "contact@tourismthailand.org"
}
```

### 10. Remove Promotion (Admin Only)
```http
DELETE /api/videos/promote/{id}
```

## Search and Filter Examples

### Search Videos
```http
GET /api/videos?filters[$or][0][title][$containsi]=thailand&filters[$or][1][description][$containsi]=thailand&filters[$or][2][channel_name][$containsi]=thailand
```

### Filter by Category
```http
GET /api/videos?filters[category][$eq]=Travel
```

### Filter by Date Range
```http
GET /api/videos?filters[video_published_at][$gte]=2024-01-01&filters[video_published_at][$lte]=2024-12-31
```

### Sort Options
```http
GET /api/videos?sort=view_count:desc
GET /api/videos?sort=like_count:desc
GET /api/videos?sort=video_published_at:desc
GET /api/videos?sort=createdAt:desc
```

## Frontend Integration Examples

### React/Next.js Example
```javascript
// Get active videos for homepage
const getActiveVideos = async (page = 1, pageSize = 6) => {
  const response = await fetch(`/api/featured-videos/approved?page=${page}&pageSize=${pageSize}`);
  const data = await response.json();
  return data;
};

// Get specific videos for widget
const getDisplaySet = async (videoIds) => {
  const ids = JSON.stringify(videoIds);
  const response = await fetch(`/api/videos/display-set?ids=${encodeURIComponent(ids)}`);
  const data = await response.json();
  return data;
};

// Search videos
const searchVideos = async (query, category = null) => {
  let url = `/api/videos?filters[$or][0][title][$containsi]=${encodeURIComponent(query)}`;
  if (category) {
    url += `&filters[category][$eq]=${encodeURIComponent(category)}`;
  }
  const response = await fetch(url);
  const data = await response.json();
  return data;
};
```

### Video Status Values
- `active` - Approved and visible to users
- `pending` - Awaiting moderation
- `rejected` - Rejected by moderators
- `archived` - Hidden from public view

### Important Notes
1. Use `videostatus` field (not `status`) for filtering
2. Only `active` videos should be displayed to end users
3. Use `documentId` for updates, `id` for references
4. Promoted videos are sorted first in display-set endpoint
5. All endpoints support standard Strapi query parameters
