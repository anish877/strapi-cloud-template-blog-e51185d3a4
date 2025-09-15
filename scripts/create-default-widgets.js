#!/usr/bin/env node

/**
 * Create Default Widgets via API
 * 
 * This script creates default widgets using the Strapi API
 */

// @ts-ignore
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:1337/api';

const defaultWidgets = [
  {
    data: {
      widgetName: 'Weather Widget',
      widgetType: 'weather',
      displayName: 'Weather',
      description: 'Current weather conditions and forecast',
      category: 'utility',
      adminControls: {
        allowUserResizing: true,
        allowUserMoving: true,
        isMandatory: false,
        canBeDeleted: true,
        isLocked: false
      },
      defaultPosition: {
        gridColumn: 3,
        gridRow: 1,
        order: 1,
        section: 'main'
      },
      defaultSize: {
        width: 'medium',
        height: 'auto',
        minWidth: 250,
        maxWidth: 400
      },
      priority: 80
    }
  },
  {
    data: {
      widgetName: 'Breaking News',
      widgetType: 'breaking-news',
      displayName: 'Breaking News',
      description: 'Latest breaking news and updates',
      category: 'core',
      adminControls: {
        allowUserResizing: true,
        allowUserMoving: true,
        isMandatory: true,
        canBeDeleted: false,
        isLocked: false
      },
      defaultPosition: {
        gridColumn: 1,
        gridRow: 1,
        order: 0,
        section: 'main'
      },
      defaultSize: {
        width: 'large',
        height: 'medium',
        minWidth: 400,
        maxWidth: 800
      },
      priority: 100
    }
  },
  {
    data: {
      widgetName: 'Hot Deals',
      widgetType: 'hot-deals',
      displayName: 'Hot Deals',
      description: 'Featured deals and promotions',
      category: 'content',
      adminControls: {
        allowUserResizing: true,
        allowUserMoving: true,
        isMandatory: true,
        canBeDeleted: false,
        isLocked: false
      },
      defaultPosition: {
        gridColumn: 1,
        gridRow: 2,
        order: 2,
        section: 'main'
      },
      defaultSize: {
        width: 'full',
        height: 'medium',
        minWidth: 600,
        maxWidth: 1200
      },
      priority: 90
    }
  },
  {
    data: {
      widgetName: 'Radio Widget',
      widgetType: 'radio',
      displayName: 'Radio',
      description: 'Live radio streaming',
      category: 'entertainment',
      adminControls: {
        allowUserResizing: true,
        allowUserMoving: true,
        isMandatory: false,
        canBeDeleted: true,
        isLocked: false
      },
      defaultPosition: {
        gridColumn: 2,
        gridRow: 1,
        order: 3,
        section: 'sidebar'
      },
      defaultSize: {
        width: 'small',
        height: 'small',
        minWidth: 200,
        maxWidth: 300
      },
      priority: 60
    }
  },
  {
    data: {
      widgetName: 'Social Feed',
      widgetType: 'social-feed',
      displayName: 'Social Feed',
      description: 'Social media feed aggregation',
      category: 'social',
      adminControls: {
        allowUserResizing: true,
        allowUserMoving: true,
        isMandatory: false,
        canBeDeleted: true,
        isLocked: false
      },
      defaultPosition: {
        gridColumn: 2,
        gridRow: 2,
        order: 4,
        section: 'sidebar'
      },
      defaultSize: {
        width: 'medium',
        height: 'large',
        minWidth: 300,
        maxWidth: 500
      },
      priority: 70
    }
  },
  {
    data: {
      widgetName: 'Currency Converter',
      widgetType: 'currency-converter',
      displayName: 'Currency Converter',
      description: 'Real-time currency conversion tool',
      category: 'utility',
      adminControls: {
        allowUserResizing: true,
        allowUserMoving: true,
        isMandatory: false,
        canBeDeleted: true,
        isLocked: false
      },
      defaultPosition: {
        gridColumn: 3,
        gridRow: 2,
        order: 5,
        section: 'main'
      },
      defaultSize: {
        width: 'medium',
        height: 'auto',
        minWidth: 250,
        maxWidth: 400
      },
      priority: 50
    }
  },
  {
    data: {
      widgetName: 'Events Calendar',
      widgetType: 'events-calendar',
      displayName: 'Events',
      description: 'Upcoming events and activities',
      category: 'content',
      adminControls: {
        allowUserResizing: true,
        allowUserMoving: true,
        isMandatory: false,
        canBeDeleted: true,
        isLocked: false
      },
      defaultPosition: {
        gridColumn: 1,
        gridRow: 3,
        order: 6,
        section: 'main'
      },
      defaultSize: {
        width: 'large',
        height: 'medium',
        minWidth: 400,
        maxWidth: 800
      },
      priority: 75
    }
  },
  {
    data: {
      widgetName: 'Business Spotlight',
      widgetType: 'business-spotlight',
      displayName: 'Business Spotlight',
      description: 'Featured local businesses',
      category: 'business',
      adminControls: {
        allowUserResizing: true,
        allowUserMoving: true,
        isMandatory: false,
        canBeDeleted: true,
        isLocked: false
      },
      defaultPosition: {
        gridColumn: 2,
        gridRow: 3,
        order: 7,
        section: 'main'
      },
      defaultSize: {
        width: 'medium',
        height: 'medium',
        minWidth: 300,
        maxWidth: 500
      },
      priority: 65
    }
  },
  {
    data: {
      widgetName: 'Ad Banner',
      widgetType: 'sponsorship-banner',
      displayName: 'Advertisement',
      description: 'Sponsored content and advertisements',
      category: 'advertising',
      adminControls: {
        allowUserResizing: false,
        allowUserMoving: false,
        isMandatory: true,
        canBeDeleted: false,
        isLocked: true
      },
      defaultPosition: {
        gridColumn: 1,
        gridRow: 0,
        order: -1,
        section: 'header'
      },
      defaultSize: {
        width: 'full',
        height: 'small',
        minWidth: 800,
        maxWidth: 1200
      },
      priority: 95
    }
  }
];

async function createDefaultWidgets() {
  try {
    console.log('🚀 Creating default widgets...\n');

    // Check if widgets already exist
    const existingResponse = await fetch(`${API_BASE}/widget-managements`);
    /** @type {any} */
    const existing = await existingResponse.json();
    
    if (existing.data && existing.data.length > 0) {
      console.log(`✅ Widgets already exist (${existing.data.length} found)`);
      existing.data.forEach(widget => {
        console.log(`   - ${widget.displayName} (${widget.widgetType})`);
      });
      return;
    }

    // Create each widget
    for (const widget of defaultWidgets) {
      try {
        const response = await fetch(`${API_BASE}/widget-managements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(widget)
        });

        if (response.ok) {
          /** @type {any} */
          const result = await response.json();
          console.log(`✅ Created: ${result.data.displayName} (${result.data.widgetType})`);
        } else {
          /** @type {any} */
          const error = await response.json();
          console.log(`❌ Failed to create ${widget.data.displayName}: ${error.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`❌ Error creating ${widget.data.displayName}: ${error.message}`);
      }
    }

    console.log('\n🎉 Default widgets creation completed!');
    
    // Verify creation
    const verifyResponse = await fetch(`${API_BASE}/widget-managements`);
    /** @type {any} */
    const verify = await verifyResponse.json();
    
    if (verify.data && verify.data.length > 0) {
      console.log(`\n📊 Summary: ${verify.data.length} widgets created`);
      
      const mandatory = verify.data.filter(w => w.adminControls?.isMandatory).length;
      const deletable = verify.data.filter(w => w.adminControls?.canBeDeleted).length;
      const locked = verify.data.filter(w => w.adminControls?.isLocked).length;
      
      console.log(`   - Mandatory: ${mandatory}`);
      console.log(`   - Deletable: ${deletable}`);
      console.log(`   - Locked: ${locked}`);
    }
    
  } catch (error) {
    console.error('❌ Error creating default widgets:', error.message);
  }
}

// Run the creation
createDefaultWidgets();
