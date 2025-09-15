#!/bin/bash

API_BASE_URL="http://localhost:1337"

echo "🎯 Populating Pattaya News Sources..."

# Function to create or update news source
create_or_update_source() {
    local name="$1"
    local description="$2"
    local sourceType="$3"
    local url="$4"
    local rssUrl="$5"
    local keyValue="$6"
    local priority="$7"
    local fetchInterval="$8"
    
    # Check if source exists
    existing_id=$(curl -s "${API_BASE_URL}/api/news-sources?filters[name][\$eq]=${name// /%20}" | jq -r '.data[0].id // empty')
    
    if [ -n "$existing_id" ]; then
        # Update existing source
        curl -s -X PUT "${API_BASE_URL}/api/news-sources/${existing_id}" \
            -H "Content-Type: application/json" \
            -d "{
                \"data\": {
                    \"name\": \"${name}\",
                    \"description\": \"${description}\",
                    \"sourceType\": \"${sourceType}\",
                    \"url\": \"${url}\",
                    \"rssUrl\": \"${rssUrl}\",
                    \"keyValue\": \"${keyValue}\",
                    \"isActive\": true,
                    \"priority\": ${priority},
                    \"fetchInterval\": ${fetchInterval}
                }
            }" > /dev/null
        echo "✅ Updated: ${name}"
    else
        # Create new source
        curl -s -X POST "${API_BASE_URL}/api/news-sources" \
            -H "Content-Type: application/json" \
            -d "{
                \"data\": {
                    \"name\": \"${name}\",
                    \"description\": \"${description}\",
                    \"sourceType\": \"${sourceType}\",
                    \"url\": \"${url}\",
                    \"rssUrl\": \"${rssUrl}\",
                    \"keyValue\": \"${keyValue}\",
                    \"isActive\": true,
                    \"priority\": ${priority},
                    \"fetchInterval\": ${fetchInterval}
                }
            }" > /dev/null
        echo "✅ Created: ${name}"
    fi
}

# Local & National English-Language Feeds (RSS)
create_or_update_source "Pattaya Mail" "Longest-running and established source for detailed local news, columns, and community events" "rss_feed" "https://www.pattayamail.com" "https://www.pattayamail.com/feed" "Primary local English news source for Pattaya" 1 30

create_or_update_source "The Thaiger" "Popular with expats, provides national context for Pattaya-related stories" "rss_feed" "https://thethaiger.com" "https://thethaiger.com/news/feed" "National news with Pattaya focus" 1 30

create_or_update_source "Bangkok Post" "Leading English-language newspaper in Thailand" "rss_feed" "https://www.bangkokpost.com" "https://www.bangkokpost.com/rss/data/most-recent.xml" "Major national English news source" 1 30

create_or_update_source "The Nation" "Major English-language daily newspaper" "rss_feed" "https://www.nationthailand.com" "https://www.nationthailand.com/rss" "National English news coverage" 1 30

create_or_update_source "Thai PBS World" "International news from Thailand" "rss_feed" "https://www.thaipbsworld.com" "https://www.thaipbsworld.com/feed/" "International perspective on Thailand news" 2 60

create_or_update_source "Khaosod English" "English news from Khaosod newspaper" "rss_feed" "https://www.khaosodenglish.com" "https://www.khaosodenglish.com/feed/" "Alternative English news source" 2 60

create_or_update_source "The Pattaya News" "Very strong focus on up-to-the-minute breaking news, crime, and tourism-related stories" "rss_feed" "https://thepattayanews.com" "https://thepattayanews.com/feed/" "Fastest English source for breaking Pattaya news" 1 15

create_or_update_source "The Thaiger Pattaya" "Pattaya-specific section of The Thaiger" "rss_feed" "https://thethaiger.com/news/pattaya" "https://thethaiger.com/news/pattaya/feed" "Dedicated Pattaya news from national source" 1 30

# Community & Lifestyle Sources
create_or_update_source "ASEAN NOW Pattaya Forum" "Major hub for expats to discuss and share news articles from various sources" "rss_feed" "https://www.aseannow.com/forum/discover/8.xml/" "https://www.aseannow.com/forum/discover/8.xml/" "Expat community news discussions" 3 120

create_or_update_source "Pattaya People" "Local newspaper and TV channel focused on lifestyle, events, and positive community news" "website_scraper" "http://pattayapeople.com/" "" "Lifestyle and community news" 3 120

echo ""
echo "🎉 Pattaya news source population completed!"
echo ""
echo "📝 Next Steps:"
echo "   1. Check the admin panel to verify sources are active"
echo "   2. Start the news scheduler to begin fetching articles"
echo "   3. Monitor the news articles API for new content"
