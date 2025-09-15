#!/bin/bash

API_BASE_URL="http://localhost:1337"

echo "🔧 Fixing news source URLs to use RSS feeds..."

# Update each news source with the correct RSS URL
curl -X PUT "${API_BASE_URL}/api/news-sources/1" -H "Content-Type: application/json" -d '{"data":{"url":"https://www.pattayamail.com/feed"}}' && echo "✅ Updated Pattaya Mail"

curl -X PUT "${API_BASE_URL}/api/news-sources/2" -H "Content-Type: application/json" -d '{"data":{"url":"https://thethaiger.com/news/feed"}}' && echo "✅ Updated The Thaiger"

curl -X PUT "${API_BASE_URL}/api/news-sources/3" -H "Content-Type: application/json" -d '{"data":{"url":"https://www.bangkokpost.com/rss/data/most-recent.xml"}}' && echo "✅ Updated Bangkok Post"

curl -X PUT "${API_BASE_URL}/api/news-sources/4" -H "Content-Type: application/json" -d '{"data":{"url":"https://www.nationthailand.com/rss"}}' && echo "✅ Updated The Nation"

curl -X PUT "${API_BASE_URL}/api/news-sources/5" -H "Content-Type: application/json" -d '{"data":{"url":"https://www.thaipbsworld.com/feed/"}}' && echo "✅ Updated Thai PBS World"

curl -X PUT "${API_BASE_URL}/api/news-sources/6" -H "Content-Type: application/json" -d '{"data":{"url":"https://www.khaosodenglish.com/feed/"}}' && echo "✅ Updated Khaosod English"

curl -X PUT "${API_BASE_URL}/api/news-sources/7" -H "Content-Type: application/json" -d '{"data":{"url":"https://thepattayanews.com/feed/"}}' && echo "✅ Updated The Pattaya News"

curl -X PUT "${API_BASE_URL}/api/news-sources/8" -H "Content-Type: application/json" -d '{"data":{"url":"https://thethaiger.com/news/pattaya/feed"}}' && echo "✅ Updated The Thaiger Pattaya"

curl -X PUT "${API_BASE_URL}/api/news-sources/9" -H "Content-Type: application/json" -d '{"data":{"url":"https://www.aseannow.com/forum/discover/8.xml/"}}' && echo "✅ Updated ASEAN NOW Pattaya Forum"

echo ""
echo "🎉 All news source URLs updated!"
echo ""
echo "📋 Updated URLs:"
curl -s "${API_BASE_URL}/api/news-sources" | jq '.data[] | {name: .name, url: .url}'

