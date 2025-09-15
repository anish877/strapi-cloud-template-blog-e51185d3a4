#!/usr/bin/env node

/**
 * SQL-based cleanup manager that bypasses Strapi API issues
 * Directly manages database to enforce article limits
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Conditional import to prevent deployment issues
let Database;
let isProductionMode = false;
try {
  Database = require('better-sqlite3');
} catch (error) {
  console.log('⚠️  better-sqlite3 not available, falling back to Strapi API mode');
  Database = null;
  isProductionMode = true;
}

class SQLCleanupManager {
  constructor() {
    // Environment-aware database path
    this.dbPath = this.getDatabasePath();
    this.isRunning = false;
    this.isEnabled = this.checkIfEnabled();
    
    if (!this.isEnabled) {
      console.log('🚫 SQL cleanup disabled in current environment');
    }
  }

  getDatabasePath() {
    // Try multiple possible database locations
    const possiblePaths = [
      process.env.DATABASE_PATH,
      process.env.SQLITE_DB_PATH,
      path.join(process.cwd(), '.tmp', 'data.db'),
      path.join(process.cwd(), 'data.db'),
      '/tmp/strapi-data.db'
    ].filter(Boolean);

    for (const dbPath of possiblePaths) {
      if (fs.existsSync(path.dirname(dbPath))) {
        return dbPath;
      }
    }

    // Fallback to a writable location
    return path.join(process.cwd(), '.tmp', 'data.db');
  }

  checkIfEnabled() {
    // Disable in production unless explicitly enabled
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_SQL_CLEANUP) {
      return false;
    }

    // Disable if database directory doesn't exist and can't be created
    try {
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      return true;
    } catch (error) {
      console.log('⚠️  Cannot create database directory, SQL cleanup disabled');
      return false;
    }
  }

  async getSettings() {
    // Use environment variable first, then try API, then default
    if (process.env.DEFAULT_ARTICLE_LIMIT) {
      const limit = parseInt(process.env.DEFAULT_ARTICLE_LIMIT);
      if (!isNaN(limit) && limit > 0) {
        console.log(`⚙️  Using environment limit: ${limit}`);
        return limit;
      }
    }

    // Try API with timeout and fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await axios.get('http://localhost:1337/api/news-settings', {
        signal: controller.signal,
        timeout: 5000
      });
      
      clearTimeout(timeoutId);
      
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0].maxArticleLimit || 5;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('⚠️  API timeout, using default limit: 5');
      } else {
        console.log('⚠️  Could not fetch settings, using default limit: 5');
      }
    }
    
    return 5; // default
  }

  async enforceLimit() {
    if (!this.isEnabled) {
      console.log('🚫 SQL cleanup is disabled, skipping...');
      return { success: true, disabled: true, message: 'Cleanup disabled' };
    }

    if (this.isRunning) {
      console.log('⏳ SQL cleanup already running, skipping...');
      return { success: true, skipped: true, message: 'Already running' };
    }

    // If SQLite bindings are unavailable, fallback to API cleanup
    if (!Database) {
      console.log('⚠️  SQLite not available, using Strapi API fallback');
      return await this.enforceLimitViaAPI();
    }

    this.isRunning = true;
    let db;

    try {
      console.log('🗑️  Starting SQL-based cleanup...');
      
      // Get current limit from settings
      const maxLimit = await this.getSettings();
      console.log(`⚙️  Max article limit: ${maxLimit}`);

      // Check if database exists
      if (!fs.existsSync(this.dbPath)) {
        console.log('📋 Database not found, creating new one...');
        // Create empty database file
        fs.writeFileSync(this.dbPath, '');
      }

      // Connect to database with error handling
      try {
        db = new Database(this.dbPath, { readonly: false });
      } catch (dbError) {
        console.log('❌ Database connection failed:', dbError.message);
        return { success: false, error: 'Database connection failed' };
      }

      // Check if table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='breaking_news_plural'
      `).get();

      if (!tableExists) {
        console.log('📋 Table not found, cleanup not needed');
        return { success: true, message: 'No articles table found' };
      }

      // Count current articles
      const currentCount = db.prepare("SELECT COUNT(*) as count FROM breaking_news_plural").get().count;
      console.log(`📊 Current articles: ${currentCount}`);

      if (currentCount <= maxLimit) {
        console.log(`✅ Article count is within limit (${currentCount}/${maxLimit})`);
        return { success: true, deleted: 0, message: 'Within limit' };
      }

      // Calculate excess
      const excessCount = currentCount - maxLimit;
      console.log(`🗑️  Need to delete ${excessCount} excess articles`);

      // Get oldest articles to delete (keep newest)
      const articlesToDelete = db.prepare(`
        SELECT id, title, created_at 
        FROM breaking_news_plural 
        ORDER BY created_at ASC 
        LIMIT ?
      `).all(excessCount);

      console.log(`📋 Deleting ${articlesToDelete.length} oldest articles:`);

      // Delete articles one by one
      let deletedCount = 0;
      const deleteStmt = db.prepare("DELETE FROM breaking_news_plural WHERE id = ?");

      for (const article of articlesToDelete) {
        try {
          const result = deleteStmt.run(article.id);
          if (result.changes > 0) {
            deletedCount++;
            console.log(`✅ Deleted: "${article.title?.substring(0, 50)}..." (ID: ${article.id})`);
          } else {
            console.log(`❌ Failed to delete ID: ${article.id}`);
          }
        } catch (deleteError) {
          console.log(`❌ Error deleting ID ${article.id}: ${deleteError.message}`);
        }
      }

      // Verify final count
      const finalCount = db.prepare("SELECT COUNT(*) as count FROM breaking_news_plural").get().count;
      console.log(`📊 Final count: ${finalCount} (deleted ${deletedCount} articles)`);

      const success = finalCount <= maxLimit;
      console.log(success ? 
        `✅ SUCCESS: Article count now within limit (${finalCount}/${maxLimit})` :
        `❌ ISSUE: Still exceeds limit (${finalCount}/${maxLimit})`
      );

      return {
        success,
        deleted: deletedCount,
        finalCount,
        maxLimit,
        message: success ? 'Cleanup successful' : 'Cleanup incomplete'
      };

    } catch (error) {
      console.error('❌ SQL cleanup failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      if (db) {
        try {
          db.close();
        } catch (closeError) {
          console.log('⚠️  Error closing database:', closeError.message);
        }
      }
      this.isRunning = false;
    }
  }

  // API-based cleanup fallback when SQLite is not available
  async enforceLimitViaAPI() {
    try {
      const maxLimit = await this.getSettings();

      // Fetch articles ordered by createdAt desc (newest first)
      const allArticles = await axios.get('http://localhost:1337/api/breaking-news-plural?sort=createdAt:desc&pagination[limit]=200');
      const articles = allArticles.data?.data || [];

      const currentCount = articles.length;
      if (currentCount <= maxLimit) {
        return { success: true, deleted: 0, finalCount: currentCount, maxLimit, message: 'Within limit' };
      }

      const excess = currentCount - maxLimit;
      const toDelete = articles.slice(maxLimit); // oldest beyond limit

      let deleted = 0;
      for (const article of toDelete) {
        try {
          await axios.delete(`http://localhost:1337/api/breaking-news-plural/${article.id}`);
          deleted++;
        } catch (err) {
          // continue on deletion errors
        }
      }

      const finalCount = currentCount - deleted;
      return {
        success: finalCount <= maxLimit,
        deleted,
        finalCount,
        maxLimit,
        message: finalCount <= maxLimit ? 'Cleanup successful (API)' : 'Cleanup incomplete (API)'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getActualCount() {
    if (!this.isEnabled) {
      return -1;
    }

    if (!Database) {
      console.log('⚠️  SQLite not available, cannot get count');
      return -1;
    }

    let db;
    try {
      if (!fs.existsSync(this.dbPath)) {
        return 0;
      }

      db = new Database(this.dbPath, { readonly: true });
      
      // Check if table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='breaking_news_plural'
      `).get();

      if (!tableExists) {
        return 0;
      }

      const count = db.prepare("SELECT COUNT(*) as count FROM breaking_news_plural").get().count;
      return count;
    } catch (error) {
      console.error('❌ Error getting count:', error.message);
      return -1;
    } finally {
      if (db) {
        try {
          db.close();
        } catch (closeError) {
          // Ignore close errors
        }
      }
    }
  }

  async cleanupDuplicates() {
    if (!this.isEnabled) {
      console.log('🚫 SQL cleanup is disabled, skipping duplicate cleanup...');
      return { success: true, disabled: true, message: 'Cleanup disabled' };
    }

    if (!Database) {
      console.log('⚠️  SQLite not available, skipping duplicate cleanup in production');
      return { success: true, deleted: 0, message: 'Skipped in production mode' };
    }

    let db;
    try {
      console.log('🔄 Cleaning up duplicate articles...');
      
      if (!fs.existsSync(this.dbPath)) {
        console.log('📋 Database not found, no duplicates to clean');
        return { success: true, deleted: 0 };
      }

      db = new Database(this.dbPath, { readonly: false });

      // Check if table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='breaking_news_plural'
      `).get();

      if (!tableExists) {
        console.log('📋 Table not found, no duplicates to clean');
        return { success: true, deleted: 0 };
      }

      // Find duplicates by URL
      const duplicates = db.prepare(`
        SELECT url, COUNT(*) as count, MIN(id) as keep_id
        FROM breaking_news_plural 
        WHERE url IS NOT NULL 
        GROUP BY url 
        HAVING COUNT(*) > 1
      `).all();

      if (duplicates.length === 0) {
        console.log('✅ No duplicates found');
        return { success: true, deleted: 0 };
      }

      console.log(`🔍 Found ${duplicates.length} duplicate URL groups`);

      let totalDeleted = 0;
      const deleteStmt = db.prepare("DELETE FROM breaking_news_plural WHERE url = ? AND id != ?");

      for (const dup of duplicates) {
        const result = deleteStmt.run(dup.url, dup.keep_id);
        totalDeleted += result.changes;
        console.log(`🗑️  Removed ${result.changes} duplicates for URL: ${dup.url?.substring(0, 50)}...`);
      }

      console.log(`✅ Removed ${totalDeleted} duplicate articles`);
      return { success: true, deleted: totalDeleted };

    } catch (error) {
      console.error('❌ Duplicate cleanup failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      if (db) {
        try {
          db.close();
        } catch (closeError) {
          console.log('⚠️  Error closing database:', closeError.message);
        }
      }
    }
  }
}

// Export for use in other scripts
module.exports = SQLCleanupManager;

// Run directly if called as script
if (require.main === module) {
  const manager = new SQLCleanupManager();
  
  async function runCleanup() {
    console.log('🚀 Running SQL Cleanup Manager...\n');
    
    if (!manager.isEnabled) {
      console.log('🚫 SQL cleanup is disabled in this environment');
      console.log('💡 To enable: set ENABLE_SQL_CLEANUP=true or NODE_ENV=development');
      process.exit(0);
    }
    
    // Clean duplicates first
    await manager.cleanupDuplicates();
    
    // Then enforce limit
    const result = await manager.enforceLimit();
    
    console.log('\n📊 Final Status:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Deleted: ${result.deleted || 0} articles`);
    console.log(`   Message: ${result.message || 'N/A'}`);
    
    if (result.finalCount !== undefined) {
      console.log(`   Final Count: ${result.finalCount}/${result.maxLimit}`);
    }
  }
  
  runCleanup().catch(console.error);
}