# Foursquare Reviews Integration Setup Guide

## 🎯 Overview

This guide covers the complete setup and testing of the Foursquare API integration for the multi-platform reviews system. The system now supports fetching reviews from Foursquare Places API alongside Google, Yelp, and Facebook.

## ✅ What's Been Implemented

### 1. **Foursquare API Service** (`src/api/google-review/services/foursquare.js`)
- Complete Foursquare Places API integration
- Place search functionality
- Tips (reviews) fetching
- Data transformation to unified review format
- Rate limiting and error handling
- Support for multiple search terms and locations

### 2. **Review Fetcher Service** (`src/api/google-review/services/review-fetcher.js`)
- Orchestrates fetching from all platforms
- Platform-specific fetching logic
- Review saving with duplicate prevention
- Statistics tracking and reporting
- Error handling and logging

### 3. **Updated Cron Jobs** (`config/cron-tasks.js`)
- Daily review fetch at 6 AM
- Daily review cleanup at 3 AM
- Proper error handling and logging

### 4. **New API Endpoints**
- `GET /api/reviews/latest` - Unified endpoint for latest reviews
- `GET /api/reviews/stats` - Review statistics
- Backward compatibility with existing endpoints

### 5. **Frontend Integration**
- Updated review widget to use new unified endpoint
- Support for multi-platform reviews display
- Fallback handling for API failures

## 🔧 Environment Setup

### Required Environment Variables

Add these to your `strapi_backend/.env` file:

```env
# Foursquare API Credentials
FOURSQUARE_CLIENT_ID=your_foursquare_client_id_here
FOURSQUARE_CLIENT_SECRET=your_foursquare_client_secret_here

# Optional: Other platform APIs (if you want to enable them)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
YELP_API_KEY=your_yelp_api_key_here
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
```

### Foursquare API Setup

1. **Create Foursquare Developer Account**
   - Go to [Foursquare for Developers](https://developer.foursquare.com/)
   - Sign up or log in to your account

2. **Create a New App**
   - Click "Create a new app"
   - Fill in app details:
     - App name: "Pattaya Reviews System"
     - Description: "Multi-platform review aggregation system"
     - Website: Your website URL
   - Accept terms and create app

3. **Get API Credentials**
   - Copy your `Client ID` and `Client Secret`
   - Add them to your `.env` file

4. **API Limits**
   - Free tier: 1,000 requests per day
   - Rate limit: 10 requests per minute
   - No credit card required for basic usage

## 🧪 Testing the Integration

### 1. Test Foursquare API Connection

```bash
cd strapi_backend
node test-foursquare-integration.js
```

This will test:
- API credentials validation
- Place search functionality
- Place details retrieval
- Tips (reviews) fetching
- Data transformation

### 2. Test Review Fetching Service

```bash
cd strapi_backend
node test-review-fetch.js
```

This will test:
- Review fetcher service
- Platform-specific fetching
- Review saving (mocked)
- Statistics tracking

### 3. Test API Endpoints

```bash
# Test the unified reviews endpoint
curl "http://localhost:1337/api/reviews/latest?limit=5"

# Test review statistics
curl "http://localhost:1337/api/reviews/stats"

# Test with platform filter
curl "http://localhost:1337/api/reviews/latest?platform=Foursquare&limit=10"
```

## 🚀 Production Deployment

### 1. **Start Strapi Backend**

```bash
cd strapi_backend
npm run develop
# or for production
npm run start
```

### 2. **Verify Cron Jobs**

The system will automatically:
- Fetch new reviews daily at 6 AM
- Clean up expired reviews daily at 3 AM
- Log all activities for monitoring

### 3. **Monitor Logs**

Check Strapi logs for:
- `🔄 Running daily review fetch...`
- `✅ Foursquare: X reviews fetched`
- `🎯 Daily review fetch completed`

### 4. **Admin Dashboard**

Access the Strapi admin panel to:
- View review settings
- Enable/disable platforms
- Monitor fetch statistics
- Manage review data

## 📊 Data Model

### Review Collection Fields

The system uses the existing `google-review` collection with these key fields:

```json
{
  "source_platform": "Foursquare",
  "source_review_id": "foursquare_12345",
  "AuthorName": "John Doe",
  "Rating": 4,
  "ReviewText": "Great restaurant with amazing food!",
  "ReviewTime": "2024-01-15T10:30:00Z",
  "BusinessName": "Pattaya Restaurant",
  "BusinessAddress": "123 Beach Road, Pattaya",
  "cache_expiry_date": "2024-02-14T10:30:00Z",
  "IsActive": true
}
```

### Platform Support

- ✅ **Foursquare**: Fully implemented
- ⏳ **Google Places**: Placeholder (needs implementation)
- ⏳ **Yelp**: Placeholder (needs implementation)
- ⏳ **Facebook**: Placeholder (needs implementation)

## 🔍 Troubleshooting

### Common Issues

1. **API Credentials Not Working**
   - Verify credentials in `.env` file
   - Check for extra spaces or quotes
   - Ensure app is active in Foursquare dashboard

2. **No Reviews Being Fetched**
   - Check Strapi logs for errors
   - Verify platform is enabled in settings
   - Test API connection manually

3. **Rate Limit Exceeded**
   - Check daily usage in Foursquare dashboard
   - Reduce search terms or frequency
   - Consider upgrading API plan

4. **Frontend Not Showing Reviews**
   - Verify API endpoints are accessible
   - Check browser network tab for errors
   - Ensure CORS is configured properly

### Debug Commands

```bash
# Check environment variables
echo $FOURSQUARE_CLIENT_ID
echo $FOURSQUARE_CLIENT_SECRET

# Test API directly
curl -H "Authorization: $FOURSQUARE_CLIENT_ID" \
  "https://places-api.foursquare.com/places/search?query=restaurants&near=Pattaya"

# Check Strapi logs
tail -f strapi_backend/logs/strapi.log
```

## 📈 Monitoring and Analytics

### Review Statistics

The system tracks:
- Total reviews fetched
- Reviews by platform
- Average ratings
- Recent activity (24h, 7d)
- Expiring reviews count

### API Usage Monitoring

Monitor your Foursquare API usage:
- Daily request count
- Rate limit status
- Error rates
- Response times

## 🔄 Maintenance

### Daily Tasks (Automated)
- Review fetching at 6 AM
- Expired review cleanup at 3 AM
- Statistics updates

### Weekly Tasks (Manual)
- Review API usage and limits
- Check for new platform features
- Update search terms if needed

### Monthly Tasks (Manual)
- Review and optimize search terms
- Analyze review quality and coverage
- Update business matching logic

## 🎉 Success Metrics

After setup, you should see:
- ✅ Foursquare reviews appearing in the frontend widget
- ✅ Daily fetch logs showing successful operations
- ✅ Review statistics showing multi-platform data
- ✅ No API rate limit errors
- ✅ Proper review expiration and cleanup

## 📞 Support

For issues with:
- **Foursquare API**: [Foursquare Developer Support](https://developer.foursquare.com/docs)
- **Strapi Integration**: Check Strapi logs and documentation
- **Frontend Issues**: Check browser console and network tab

---

**🎯 The Foursquare reviews integration is now complete and ready for production use!**
