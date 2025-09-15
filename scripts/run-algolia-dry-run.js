require('dotenv').config();
const OptimizedAlgoliaService = require('./optimized-algolia-service');

(async () => {
  try {
    const svc = new OptimizedAlgoliaService();
    // Monkeypatch saveObjects/saveObject to avoid real indexing
    const dryRun = true;
    if (dryRun) {
      const idx = svc.unifiedIndex;
      idx.saveObjects = async (objs) => {
        console.log(`DRY-RUN: would index ${objs.length} objects to unified_search`);
        // Show a couple of examples
        console.log('Example object:', objs[0]);
        return { objectIDs: objs.slice(0, 5).map(o => o.objectID) };
      };
      idx.saveObject = async (obj) => {
        console.log(`DRY-RUN: would upsert object ${obj.objectID}`);
        return { objectID: obj.objectID };
      };
    }

    // Also avoid remote Algolia settings calls in dry-run
    svc.unifiedIndex.setSettings = async (settings) => {
      console.log('DRY-RUN: would set Algolia index settings');
      return settings;
    };

    await svc.configureIndex();
    const total = await svc.indexAllContent();
    console.log(`DRY-RUN COMPLETE: prepared ${total} total items`);
  } catch (err) {
    console.error('Dry run failed:', err);
    process.exit(1);
  }
})();




