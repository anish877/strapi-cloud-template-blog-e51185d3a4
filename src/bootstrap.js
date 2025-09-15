'use strict';

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const admin = require('../config/firebase');

async function seedExampleApp() {
  const shouldImportSeedData = await isFirstRun();

  if (shouldImportSeedData) {
    try {
      console.log('Setting up the template...');
      await importSeedData();
      console.log('Ready to go');
    } catch (error) {
      console.log('Could not import seed data');
      console.error(error);
    }
  } else {
    console.log(
      'Seed data has already been imported. We cannot reimport unless you clear your database first.'
    );
  }
}

async function isFirstRun() {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  });
  const initHasRun = await pluginStore.get({ key: 'initHasRun' });
  await pluginStore.set({ key: 'initHasRun', value: true });
  return !initHasRun;
}

async function setPublicPermissions(newPermissions) {
  // Find the ID of the public role
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'public',
    },
  });

  // Create the new permissions and link them to the public role
  const allPermissionsToCreate = [];
  Object.keys(newPermissions).map((controller) => {
    const actions = newPermissions[controller];
    const permissionsToCreate = actions.map((action) => {
      return strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::${controller}.${controller}.${action}`,
          role: publicRole.id,
        },
      });
    });
    allPermissionsToCreate.push(...permissionsToCreate);
  });
  await Promise.all(allPermissionsToCreate);
}

function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats['size'];
  return fileSizeInBytes;
}

function getFileData(fileName) {
  const filePath = path.join('data', 'uploads', fileName);
  // Parse the file metadata
  const size = getFileSizeInBytes(filePath);
  const ext = fileName.split('.').pop();
  const mimeType = mime.lookup(ext || '') || '';

  return {
    filepath: filePath,
    originalFileName: fileName,
    size,
    mimetype: mimeType,
  };
}

async function uploadFile(file, name) {
  return strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: file,
      data: {
        fileInfo: {
          alternativeText: `An image uploaded to Strapi called ${name}`,
          caption: name,
          name,
        },
      },
    });
}

// Create an entry and attach files if there are any
async function createEntry({ model, entry }) {
  try {
    // Actually create the entry in Strapi
    await strapi.documents(`api::${model}.${model}`).create({
      data: entry,
    });
  } catch (error) {
    console.error({ model, entry, error });
  }
}

async function checkFileExistsBeforeUpload(files) {
  const existingFiles = [];
  const uploadedFiles = [];
  const filesCopy = [...files];

  for (const fileName of filesCopy) {
    // Check if the file already exists in Strapi
    const fileWhereName = await strapi.query('plugin::upload.file').findOne({
      where: {
        name: fileName.replace(/\..*$/, ''),
      },
    });

    if (fileWhereName) {
      // File exists, don't upload it
      existingFiles.push(fileWhereName);
    } else {
      // File doesn't exist, upload it
      const fileData = getFileData(fileName);
      const fileNameNoExtension = fileName.split('.').shift();
      const [file] = await uploadFile(fileData, fileNameNoExtension);
      uploadedFiles.push(file);
    }
  }
  const allFiles = [...existingFiles, ...uploadedFiles];
  // If only one file then return only that file
  return allFiles.length === 1 ? allFiles[0] : allFiles;
}

async function updateBlocks(blocks) {
  const updatedBlocks = [];
  for (const block of blocks) {
    if (block.__component === 'shared.media') {
      const uploadedFiles = await checkFileExistsBeforeUpload([block.file]);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file name on the block with the actual file
      blockCopy.file = uploadedFiles;
      updatedBlocks.push(blockCopy);
    } else if (block.__component === 'shared.slider') {
      // Get files already uploaded to Strapi or upload new files
      const existingAndUploadedFiles = await checkFileExistsBeforeUpload(block.files);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file names on the block with the actual files
      blockCopy.files = existingAndUploadedFiles;
      // Push the updated block
      updatedBlocks.push(blockCopy);
    } else {
      // Just push the block as is
      updatedBlocks.push(block);
    }
  }

  return updatedBlocks;
}

async function importSeedData() {
  // Allow read of application content types
  await setPublicPermissions({
    'flight-tracker': ['find', 'findOne'],
    'videos': ['find', 'findOne'],
    'trusted-channels-video': ['find', 'findOne'],
    'banned-channels-video': ['find', 'findOne'],
    'banned-keywords-video': ['find', 'findOne'],
    'video-search-keywords': ['find', 'findOne'],
    'trending-tags-video': ['find', 'findOne'],
    'news-settings': ['find', 'findOne', 'create', 'update'],
    'news-sources': ['find', 'findOne'],
  });

  console.log('Flight Tracker Widget permissions set up successfully');
  console.log('Featured Videos Widget permissions set up successfully');
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await seedExampleApp();
  await app.destroy();

  process.exit(0);
}


module.exports = async ({ strapi }) => {
  // Make Firebase admin available globally if initialized
  strapi.firebase = admin;
  
  if (admin?.apps?.length) {
    console.log('🔥 Firebase Admin SDK initialized successfully');
    try {
      await admin.auth().listUsers(1);
      console.log('✅ Firebase Auth connection verified');
    } catch (error) {
      console.error('❌ Firebase Auth connection failed:', error.message);
    }
  } else {
    console.warn('Firebase Admin not initialized. Skipping Firebase checks.');
  }
  
  await seedExampleApp();
  
  // Auto-start schedulers with graceful prerequisite handling
  console.log('🚀 Starting schedulers with graceful prerequisite handling...');
  
  // Start News Scheduler with fallback
  try {
    const NewsSchedulerPath = path.join(process.cwd(), 'scripts', 'alternative-scheduler.js');
    const NewsScheduler = require(NewsSchedulerPath);
    const newsScheduler = new NewsScheduler();
    
    setImmediate(() => {
      newsScheduler.start().catch(error => {
        console.log('⚠️  News Scheduler will retry when prerequisites are available:', error.message);
      });
    });
    
    console.log('✅ News Scheduler started (will handle missing prerequisites gracefully)');
  } catch (error) {
    console.log('⚠️  News Scheduler failed to initialize:', error.message);
  }
  
  // Start Video Scheduler with fallback
  try {
    const VideoSchedulerPath = path.join(process.cwd(), 'scripts', 'alternative-video-scheduler.js');
    const AlternativeVideoScheduler = require(VideoSchedulerPath);
    const videoScheduler = new AlternativeVideoScheduler();
    
    setImmediate(() => {
      videoScheduler.start().catch(error => {
        console.log('⚠️  Video Scheduler will retry when prerequisites are available:', error.message);
      });
    });
    
    console.log('✅ Video Scheduler started (has built-in fallback topics)');
  } catch (error) {
    console.log('⚠️  Video Scheduler failed to initialize:', error.message);
  }
  
  console.log('📋 Manual trigger endpoints also available:');
  console.log('   🎬 Video: POST /api/schedulers/video/start');
  console.log('   🗞️  News: POST /api/schedulers/news/start');
  console.log('   🚀 Both: POST /api/schedulers/start-all');
  
  console.log('✅ Flight Tracker Widget backend initialized successfully');
};
