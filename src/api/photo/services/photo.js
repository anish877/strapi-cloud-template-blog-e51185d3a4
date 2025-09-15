'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::photo.photo', ({ strapi }) => ({
  async processImageUpload(imageId) {
    try {
      const imageEntity = await strapi.entityService.findOne('plugin::upload.file', imageId);
      if (!imageEntity) {
        throw new Error('Image not found');
      }

      // Get image buffer
      const imageBuffer = await strapi.plugins.upload.services.upload.getFileBuffer(imageEntity);
      
      // Process with sharp to get metadata
      const sharp = require('sharp');
      const metadata = await sharp(imageBuffer).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        orientation: metadata.width > metadata.height ? 'landscape' : 
                    metadata.height > metadata.width ? 'portrait' : 'square',
        format: metadata.format,
        size: metadata.size
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  },

  async getPhotosByHashtag(hashtagName, limit = 20) {
    const hashtag = await strapi.entityService.findMany('api::hashtag.hashtag', {
      filters: { name: hashtagName }
    });

    if (!hashtag || hashtag.length === 0) {
      return [];
    }

    const photos = await strapi.entityService.findMany('api::photo.photo', {
      filters: { 
        status: { $eq: 'approved' },
        hashtags: { id: { $eq: hashtag[0].id } }
      },
      sort: { uploaded_at: 'desc' },
      limit,
      populate: ['author', 'hashtags', 'image']
    });

    return photos;
  },

  async getPhotosByUser(userId, limit = 20) {
    const photos = await strapi.entityService.findMany('api::photo.photo', {
      filters: { 
        status: { $eq: 'approved' },
        author: { id: { $eq: userId } }
      },
      sort: { uploaded_at: 'desc' },
      limit,
      populate: ['author', 'hashtags', 'image']
    });

    return photos;
  },

  async searchPhotos(query, limit = 20) {
    const photos = await strapi.entityService.findMany('api::photo.photo', {
      filters: { 
        status: { $eq: 'approved' },
        $or: [
          { caption: { $containsi: query } },
          { hashtags: { name: { $containsi: query } } }
        ]
      },
      sort: { uploaded_at: 'desc' },
      limit,
      populate: ['author', 'hashtags', 'image']
    });

    return photos;
  },

  async getPendingPhotos(limit = 50) {
    const photos = await strapi.entityService.findMany('api::photo.photo', {
      filters: { status: { $eq: 'pending' } },
      sort: { uploaded_at: 'asc' },
      limit,
      populate: ['author', 'hashtags', 'image']
    });

    return photos;
  }
}));
