# Social Media API Setup Guide

To fetch real social media posts related to Pattaya, you need to configure API keys for various platforms.

## Required Environment Variables

Add these to your `.env` file in the `strapi_backend` directory:

### Twitter/X API v2
```bash
# Get your Bearer Token from: https://developer.twitter.com/en/portal/dashboard
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here

# Optional: For more advanced features
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
```

### Reddit API
```bash
# Create an app at: https://www.reddit.com/prefs/apps
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
```

### Instagram API (Future)
```bash
# Instagram Basic Display API
INSTAGRAM_APP_ID=your_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
```

### News API (Future)
```bash
# Get API key from: https://newsapi.org/
NEWS_API_KEY=your_news_api_key_here
```

## How to Get API Keys

### Twitter/X API
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project/app
3. Generate a Bearer Token
4. Copy the token to your `.env` file

### Reddit API
1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Choose "script" as the app type
4. Note down the client ID and secret
5. Add them to your `.env` file

## Testing the APIs

Once you've added the API keys:

1. Restart your Strapi server
2. Test the social feed endpoint:
   ```bash
   curl "http://localhost:1337/api/social-feed/live?keywords=Pattaya&limit=5"
   ```

## Fallback Behavior

If API keys are not configured, the system will automatically use fallback data to ensure the widget always shows content.

## Rate Limits

- **Twitter**: 300 requests per 15-minute window
- **Reddit**: 60 requests per minute
- The system includes automatic rate limiting and caching
