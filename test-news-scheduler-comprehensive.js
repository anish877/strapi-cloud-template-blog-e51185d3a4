const axios = require('axios');

class NewsSchedulerTester {
  constructor() {
    this.baseUrl = 'http://localhost:1337';
    this.testResults = [];
    this.originalSettings = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${icon} ${message}`);
  }

  async addResult(testName, passed, details = '') {
    this.testResults.push({ testName, passed, details });
    this.log(`${testName}: ${passed ? 'PASSED' : 'FAILED'} ${details}`, passed ? 'success' : 'error');
  }

  // Test 1: News Settings API Endpoints
  async testNewsSettingsAPI() {
    this.log('=== Testing News Settings API ===');
    
    try {
      // Test GET endpoint
      const getResponse = await axios.get(`${this.baseUrl}/api/news-settings`);
      await this.addResult('GET /api/news-settings', 
        getResponse.status === 200 && getResponse.data.data, 
        `Status: ${getResponse.status}`);
      
      this.originalSettings = getResponse.data.data;
      
      // Test PUT endpoint (update settings)
      const testSettings = {
        fetchIntervalMinutes: 15,
        autoModerationEnabled: true,
        maxArticlesPerFetch: 10,
        maxArticleLimit: 15,
        moderationKeywords: ['test', 'spam', 'fake']
      };
      
      const putResponse = await axios.put(`${this.baseUrl}/api/news-settings`, {
        data: testSettings
      });
      
      await this.addResult('PUT /api/news-settings', 
        putResponse.status === 200 && putResponse.data.data.fetchIntervalMinutes === 15,
        `Updated fetchInterval: ${putResponse.data.data.fetchIntervalMinutes}`);
      
      return true;
    } catch (error) {
      await this.addResult('News Settings API', false, error.message);
      return false;
    }
  }

  // Test 2: News Sources API
  async testNewsSourcesAPI() {
    this.log('=== Testing News Sources API ===');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/news-sources`);
      const sources = response.data.data;
      
      await this.addResult('GET /api/news-sources', 
        response.status === 200 && Array.isArray(sources) && sources.length > 0,
        `Found ${sources.length} news sources`);
      
      // Check for active sources
      const activeSources = sources.filter(s => s.isActive);
      await this.addResult('Active news sources available', 
        activeSources.length > 0,
        `${activeSources.length} active sources`);
      
      return sources;
    } catch (error) {
      await this.addResult('News Sources API', false, error.message);
      return [];
    }
  }

  // Test 3: Breaking News API
  async testBreakingNewsAPI() {
    this.log('=== Testing Breaking News API ===');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/breaking-news-plural`);
      const articles = response.data.data;
      
      await this.addResult('GET /api/breaking-news-plural', 
        response.status === 200 && Array.isArray(articles),
        `Found ${articles.length} articles`);
      
      return articles;
    } catch (error) {
      await this.addResult('Breaking News API', false, error.message);
      return [];
    }
  }

  // Test 4: Content Moderation Logic
  async testContentModeration() {
    this.log('=== Testing Content Moderation ===');
    
    try {
      // Import the NewsScheduler class
      const NewsScheduler = require('./scripts/alternative-scheduler.js');
      const scheduler = new NewsScheduler();
      
      // Get current settings
      const settings = await scheduler.getNewsSettings();
      
      // Test moderation with banned keywords
      const testCases = [
        { title: 'Normal news title', content: 'Regular news content', shouldBlock: false },
        { title: 'This is spam content', content: 'Buy now!', shouldBlock: true },
        { title: 'Fake news alert', content: 'Misleading information', shouldBlock: true },
        { title: 'Regular article', content: 'Informative content', shouldBlock: false }
      ];
      
      let passedTests = 0;
      for (const testCase of testCases) {
        const result = scheduler.shouldModerateContent(testCase.title, testCase.content, settings);
        const passed = result.shouldModerate === testCase.shouldBlock;
        if (passed) passedTests++;
        
        this.log(`Moderation test: "${testCase.title}" - ${passed ? 'PASSED' : 'FAILED'}`, 
          passed ? 'success' : 'error');
      }
      
      await this.addResult('Content Moderation Logic', 
        passedTests === testCases.length,
        `${passedTests}/${testCases.length} tests passed`);
      
      return true;
    } catch (error) {
      await this.addResult('Content Moderation', false, error.message);
      return false;
    }
  }

  // Test 5: Settings Priority (Database vs Fallback)
  async testSettingsPriority() {
    this.log('=== Testing Settings Priority ===');
    
    try {
      const NewsScheduler = require('./scripts/alternative-scheduler.js');
      const scheduler = new NewsScheduler();
      
      // Test with database settings available
      const dbSettings = await scheduler.getNewsSettings();
      await this.addResult('Database settings retrieval', 
        dbSettings && dbSettings.fetchIntervalMinutes,
        `fetchInterval: ${dbSettings.fetchIntervalMinutes}min`);
      
      // Verify database settings take priority over built-in
      const hasDatabaseValues = dbSettings.fetchIntervalMinutes !== scheduler.builtInNewsSettings.fetchIntervalMinutes;
      await this.addResult('Database settings priority', 
        hasDatabaseValues,
        'Database values override built-in fallback');
      
      return true;
    } catch (error) {
      await this.addResult('Settings Priority', false, error.message);
      return false;
    }
  }

  // Test 6: Scheduler Integration
  async testSchedulerIntegration() {
    this.log('=== Testing Scheduler Integration ===');
    
    try {
      const NewsScheduler = require('./scripts/alternative-scheduler.js');
      const scheduler = new NewsScheduler();
      
      // Test settings integration
      const settings = await scheduler.getNewsSettings();
      await this.addResult('Scheduler settings integration', 
        settings && typeof settings.maxArticlesPerFetch === 'number',
        `maxArticlesPerFetch: ${settings.maxArticlesPerFetch}`);
      
      // Test built-in fallback structure
      const fallbackSettings = scheduler.builtInNewsSettings;
      const requiredFields = ['fetchIntervalMinutes', 'maxArticlesPerFetch', 'maxArticleLimit', 'autoModerationEnabled'];
      const hasAllFields = requiredFields.every(field => fallbackSettings.hasOwnProperty(field));
      
      await this.addResult('Built-in fallback completeness', 
        hasAllFields,
        `Contains all ${requiredFields.length} required fields`);
      
      return true;
    } catch (error) {
      await this.addResult('Scheduler Integration', false, error.message);
      return false;
    }
  }

  // Test 7: Advanced Cleanup Logic
  async testAdvancedCleanup() {
    this.log('=== Testing Advanced Cleanup Logic ===');
    
    try {
      const NewsScheduler = require('./scripts/alternative-scheduler.js');
      const scheduler = new NewsScheduler();
      
      // Test cleanup modes
      const cleanupModes = ['count_only', 'age_only', 'both_count_and_age'];
      const settings = await scheduler.getNewsSettings();
      
      await this.addResult('Cleanup mode configuration', 
        cleanupModes.includes(settings.cleanupMode),
        `Current mode: ${settings.cleanupMode}`);
      
      // Test preservation settings
      const preservationSettings = ['preservePinnedArticles', 'preserveBreakingNews'];
      const hasPreservationSettings = preservationSettings.every(field => 
        typeof settings[field] === 'boolean'
      );
      
      await this.addResult('Article preservation settings', 
        hasPreservationSettings,
        'Pinned and breaking news preservation configured');
      
      return true;
    } catch (error) {
      await this.addResult('Advanced Cleanup', false, error.message);
      return false;
    }
  }

  // Test 8: Error Handling and Fallbacks
  async testErrorHandling() {
    this.log('=== Testing Error Handling ===');
    
    try {
      const NewsScheduler = require('./scripts/alternative-scheduler.js');
      const scheduler = new NewsScheduler();
      
      // Test graceful fallback when API is unavailable
      const originalAxios = axios.get;
      
      // Mock API failure
      axios.get = async (url) => {
        if (url.includes('/api/news-settings')) {
          throw new Error('Simulated API failure');
        }
        return originalAxios(url);
      };
      
      const fallbackSettings = await scheduler.getNewsSettings();
      
      // Restore original axios
      axios.get = originalAxios;
      
      await this.addResult('Graceful fallback on API failure', 
        fallbackSettings && fallbackSettings.fetchIntervalMinutes === scheduler.builtInNewsSettings.fetchIntervalMinutes,
        'Falls back to built-in settings when API fails');
      
      return true;
    } catch (error) {
      await this.addResult('Error Handling', false, error.message);
      return false;
    }
  }

  // Test 9: Performance and Memory
  async testPerformance() {
    this.log('=== Testing Performance ===');
    
    try {
      const NewsScheduler = require('./scripts/alternative-scheduler.js');
      
      // Test multiple scheduler instances
      const startTime = Date.now();
      const schedulers = [];
      
      for (let i = 0; i < 5; i++) {
        schedulers.push(new NewsScheduler());
      }
      
      const creationTime = Date.now() - startTime;
      
      await this.addResult('Multiple scheduler creation', 
        creationTime < 1000,
        `Created 5 instances in ${creationTime}ms`);
      
      // Test settings retrieval performance
      const settingsStartTime = Date.now();
      await schedulers[0].getNewsSettings();
      const settingsTime = Date.now() - settingsStartTime;
      
      await this.addResult('Settings retrieval performance', 
        settingsTime < 500,
        `Retrieved settings in ${settingsTime}ms`);
      
      return true;
    } catch (error) {
      await this.addResult('Performance Test', false, error.message);
      return false;
    }
  }

  // Restore original settings
  async restoreOriginalSettings() {
    if (this.originalSettings) {
      try {
        await axios.put(`${this.baseUrl}/api/news-settings`, {
          data: this.originalSettings
        });
        this.log('Original settings restored', 'success');
      } catch (error) {
        this.log('Failed to restore original settings', 'error');
      }
    }
  }

  // Generate test report
  generateReport() {
    this.log('=== COMPREHENSIVE TEST REPORT ===');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   📈 Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.testName}: ${result.details}`);
      });
    }
    
    console.log(`\n✅ PASSED TESTS:`);
    this.testResults.filter(r => r.passed).forEach(result => {
      console.log(`   • ${result.testName}: ${result.details}`);
    });
    
    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: (passedTests/totalTests)*100
    };
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Comprehensive News Scheduler Test Suite...\n');
    
    try {
      // Run all test suites
      await this.testNewsSettingsAPI();
      await this.testNewsSourcesAPI();
      await this.testBreakingNewsAPI();
      await this.testContentModeration();
      await this.testSettingsPriority();
      await this.testSchedulerIntegration();
      await this.testAdvancedCleanup();
      await this.testErrorHandling();
      await this.testPerformance();
      
      // Restore original settings
      await this.restoreOriginalSettings();
      
      // Generate final report
      const report = this.generateReport();
      
      console.log(`\n🎯 TEST SUITE COMPLETED`);
      console.log(`   ${report.passed}/${report.total} tests passed (${report.successRate.toFixed(1)}%)`);
      
      if (report.successRate >= 90) {
        console.log('   🎉 EXCELLENT! News scheduler is working properly.');
      } else if (report.successRate >= 75) {
        console.log('   👍 GOOD! Minor issues detected.');
      } else {
        console.log('   ⚠️  NEEDS ATTENTION! Multiple issues detected.');
      }
      
      return report;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      return { total: 0, passed: 0, failed: 0, successRate: 0 };
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new NewsSchedulerTester();
  tester.runAllTests().then(report => {
    process.exit(report.successRate >= 75 ? 0 : 1);
  }).catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
}

module.exports = NewsSchedulerTester;
