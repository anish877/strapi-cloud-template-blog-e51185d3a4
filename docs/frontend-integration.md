# Frontend Integration Guide

## Backend Configuration (Already Done)
- ✅ CORS configured for multiple frontend ports
- ✅ Breaking news API endpoints available
- ✅ Multi-source news fetching system ready

## API Endpoints Available

### Breaking News Endpoints
```
Base URL: http://localhost:1337/api

GET /breaking-news                    # Get all breaking news
GET /breaking-news/:id               # Get specific article
GET /breaking-news/dashboard         # Admin dashboard data
GET /breaking-news/live             # Live feed (approved articles)
POST /breaking-news/:id/pin         # Pin article
POST /breaking-news/:id/unpin       # Unpin article
POST /breaking-news/:id/upvote      # Upvote article
POST /breaking-news/:id/downvote    # Downvote article
POST /breaking-news/:id/approve     # Approve article
POST /breaking-news/:id/reject      # Reject article
POST /breaking-news/:id/hide        # Hide article
POST /breaking-news/fetch-news      # Manual news fetch
```

### News Sources Management
```
GET /news-sources                   # Get all news sources
POST /news-sources                  # Create new source
PUT /news-sources/:id              # Update source
DELETE /news-sources/:id           # Delete source
```

### Global Settings
```
GET /news-settings                 # Get global settings
PUT /news-settings                 # Update settings
```

## Frontend Implementation Examples

### React/Next.js Example
```javascript
// api/newsApi.js
const API_BASE = 'http://localhost:1337/api';

export const newsApi = {
  // Get live breaking news
  getLiveNews: async () => {
    const response = await fetch(`${API_BASE}/breaking-news/live`);
    return response.json();
  },

  // Get dashboard data
  getDashboard: async () => {
    const response = await fetch(`${API_BASE}/breaking-news/dashboard`);
    return response.json();
  },

  // Pin/unpin article
  pinArticle: async (id) => {
    const response = await fetch(`${API_BASE}/breaking-news/${id}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  // Vote on article
  voteArticle: async (id, type) => {
    const response = await fetch(`${API_BASE}/breaking-news/${id}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  // Manual news fetch
  fetchNews: async () => {
    const response = await fetch(`${API_BASE}/breaking-news/fetch-news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }
};
```

### Vue.js Example
```javascript
// composables/useNews.js
import { ref, onMounted } from 'vue'

export function useNews() {
  const news = ref([])
  const loading = ref(false)
  const API_BASE = 'http://localhost:1337/api'

  const fetchLiveNews = async () => {
    loading.value = true
    try {
      const response = await fetch(`${API_BASE}/breaking-news/live`)
      const data = await response.json()
      news.value = data.data || []
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      loading.value = false
    }
  }

  const pinArticle = async (id) => {
    try {
      await fetch(`${API_BASE}/breaking-news/${id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      await fetchLiveNews() // Refresh
    } catch (error) {
      console.error('Failed to pin article:', error)
    }
  }

  onMounted(() => {
    fetchLiveNews()
  })

  return {
    news,
    loading,
    fetchLiveNews,
    pinArticle
  }
}
```

### Angular Example
```typescript
// services/news.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiBase = 'http://localhost:1337/api';

  constructor(private http: HttpClient) {}

  getLiveNews(): Observable<any> {
    return this.http.get(`${this.apiBase}/breaking-news/live`);
  }

  getDashboard(): Observable<any> {
    return this.http.get(`${this.apiBase}/breaking-news/dashboard`);
  }

  pinArticle(id: string): Observable<any> {
    return this.http.post(`${this.apiBase}/breaking-news/${id}/pin`, {});
  }

  voteArticle(id: string, type: 'upvote' | 'downvote'): Observable<any> {
    return this.http.post(`${this.apiBase}/breaking-news/${id}/${type}`, {});
  }
}
```

## Environment Configuration

### Frontend .env file
```env
# Development
REACT_APP_API_URL=http://localhost:1337/api
# or
VITE_API_URL=http://localhost:1337/api
# or
NEXT_PUBLIC_API_URL=http://localhost:1337/api

# Production
REACT_APP_API_URL=https://your-strapi-backend.com/api
```

## Real-time Updates (Optional)
For live updates, you can implement polling or WebSocket connections:

```javascript
// Polling example
const useNewsPolling = (interval = 30000) => {
  useEffect(() => {
    const timer = setInterval(() => {
      fetchLiveNews();
    }, interval);
    
    return () => clearInterval(timer);
  }, []);
};
```

## Authentication (If Needed)
If you need authentication, use the JWT tokens from Strapi:

```javascript
// With authentication
const authHeaders = {
  'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
  'Content-Type': 'application/json'
};
```
