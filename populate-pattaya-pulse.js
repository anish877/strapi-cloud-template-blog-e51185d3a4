const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Populate Pattaya Pulse with sample data
 * This script creates sample hashtags and photos for testing
 */

async function populatePattayaPulse() {
  console.log('🚀 Starting Pattaya Pulse population...');

  try {
    // Sample hashtags
    const hashtags = [
      { name: 'pattaya', description: 'General Pattaya content' },
      { name: 'beach', description: 'Beach and coastal photos' },
      { name: 'sunset', description: 'Beautiful sunsets' },
      { name: 'nightlife', description: 'Pattaya nightlife scene' },
      { name: 'streetfood', description: 'Local street food' },
      { name: 'culture', description: 'Thai culture and traditions' },
      { name: 'temple', description: 'Buddhist temples' },
      { name: 'market', description: 'Local markets' },
      { name: 'walkingstreet', description: 'Walking Street Pattaya' },
      { name: 'jomtien', description: 'Jomtien Beach area' },
      { name: 'kohlan', description: 'Koh Larn island' },
      { name: 'floatingmarket', description: 'Floating markets' },
      { name: 'elephant', description: 'Elephant encounters' },
      { name: 'muaythai', description: 'Muay Thai boxing' },
      { name: 'massage', description: 'Thai massage' },
      { name: 'shopping', description: 'Shopping in Pattaya' },
      { name: 'hotel', description: 'Hotels and resorts' },
      { name: 'restaurant', description: 'Restaurants and dining' },
      { name: 'bar', description: 'Bars and pubs' },
      { name: 'club', description: 'Nightclubs' }
    ];

    console.log('📝 Creating hashtags...');
    
    // Create hashtags
    for (const hashtagData of hashtags) {
      try {
        const response = await fetch('http://localhost:1337/api/hashtags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              name: hashtagData.name,
              description: hashtagData.description,
              usage_count: Math.floor(Math.random() * 50) + 1,
              is_trending: Math.random() > 0.7
            }
          })
        });

        if (response.ok) {
          console.log(`✅ Created hashtag: #${hashtagData.name}`);
        } else {
          console.log(`⚠️  Hashtag #${hashtagData.name} might already exist`);
        }
      } catch (error) {
        console.log(`❌ Error creating hashtag #${hashtagData.name}:`, error.message);
      }
    }

    // Sample photo data
    const samplePhotos = [
      {
        caption: "Beautiful sunset over Pattaya Beach 🌅",
        location: {
          latitude: 12.9236,
          longitude: 100.8825,
          address: "Pattaya Beach",
          city: "Pattaya",
          country: "Thailand"
        },
        hashtags: ['pattaya', 'beach', 'sunset'],
        featured: true
      },
      {
        caption: "Vibrant nightlife on Walking Street 🎉",
        location: {
          latitude: 12.9236,
          longitude: 100.8825,
          address: "Walking Street",
          city: "Pattaya",
          country: "Thailand"
        },
        hashtags: ['pattaya', 'nightlife', 'walkingstreet'],
        featured: false
      },
      {
        caption: "Delicious Thai street food at Thepprasit Market 🍜",
        location: {
          latitude: 12.9236,
          longitude: 100.8825,
          address: "Thepprasit Market",
          city: "Pattaya",
          country: "Thailand"
        },
        hashtags: ['streetfood', 'market', 'culture'],
        featured: false
      },
      {
        caption: "Peaceful morning at Jomtien Beach 🏖️",
        location: {
          latitude: 12.9236,
          longitude: 100.8825,
          address: "Jomtien Beach",
          city: "Pattaya",
          country: "Thailand"
        },
        hashtags: ['jomtien', 'beach', 'pattaya'],
        featured: true
      },
      {
        caption: "Traditional Thai temple architecture 🏛️",
        location: {
          latitude: 12.9236,
          longitude: 100.8825,
          address: "Wat Chai Mongkol",
          city: "Pattaya",
          country: "Thailand"
        },
        hashtags: ['temple', 'culture', 'pattaya'],
        featured: false
      },
      {
        caption: "Koh Larn island paradise 🏝️",
        location: {
          latitude: 12.9236,
          longitude: 100.8825,
          address: "Koh Larn",
          city: "Pattaya",
          country: "Thailand"
        },
        hashtags: ['kohlan', 'beach', 'island'],
        featured: true
      },
      {
        caption: "Floating market experience 🛶",
        location: {
          latitude: 12.9236,
          longitude: 100.8825,
          address: "Floating Market",
          city: "Pattaya",
          country: "Thailand"
        },
        hashtags: ['floatingmarket', 'culture', 'market'],
        featured: false
      },
      {
        caption: "Muay Thai training session 🥊",
        location: {
          latitude: 12.9236,
          longitude: 100.8825,
          address: "Muay Thai Gym",
          city: "Pattaya",
          country: "Thailand"
        },
        hashtags: ['muaythai', 'culture', 'sports'],
        featured: false
      }
    ];

    console.log('📸 Creating sample photos...');

    // Create a sample image for each photo
    for (let i = 0; i < samplePhotos.length; i++) {
      const photoData = samplePhotos[i];
      
      try {
        // Create a sample image using sharp
        const imageBuffer = await sharp({
          create: {
            width: 800,
            height: 600,
            channels: 3,
            background: { r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255) }
          }
        })
        .png()
        .toBuffer();

        // Convert image buffer to base64
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

        // Get hashtag IDs
        const hashtagIds = [];
        for (const hashtagName of photoData.hashtags) {
          try {
            const hashtagResponse = await fetch(`http://localhost:1337/api/hashtags?filters[name][$eq]=${hashtagName}`);
            if (hashtagResponse.ok) {
              const hashtagData = await hashtagResponse.json();
              if (hashtagData.data && hashtagData.data.length > 0) {
                hashtagIds.push(hashtagData.data[0].id);
              }
            }
          } catch (error) {
            console.log(`⚠️  Could not find hashtag: ${hashtagName}`);
          }
        }

        // Create photo record
        const photoRecord = {
          data: {
            image: base64Image,
            caption: photoData.caption,
            hashtags: hashtagIds,
            location: photoData.location,
            likes: Math.floor(Math.random() * 100),
            views: Math.floor(Math.random() * 500) + 50,
            width: 800,
            height: 600,
            orientation: 'landscape',
            featured: photoData.featured,
            status: 'approved',
            uploaded_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
            approved_at: new Date().toISOString()
          }
        };

        const photoResponse = await fetch('http://localhost:1337/api/photos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(photoRecord)
        });

        if (photoResponse.ok) {
          console.log(`✅ Created photo: ${photoData.caption.substring(0, 50)}...`);
        } else {
          console.log(`❌ Failed to create photo ${i + 1}`);
        }

      } catch (error) {
        console.log(`❌ Error creating photo ${i + 1}:`, error.message);
      }
    }

    console.log('🎉 Pattaya Pulse population completed!');
    console.log('📊 Summary:');
    console.log(`   - Created ${hashtags.length} hashtags`);
    console.log(`   - Created ${samplePhotos.length} sample photos`);
    console.log('🌐 You can now visit http://localhost:3000/photos to see the gallery!');

  } catch (error) {
    console.error('❌ Error populating Pattaya Pulse:', error);
  }
}

// Run the population script
populatePattayaPulse();
