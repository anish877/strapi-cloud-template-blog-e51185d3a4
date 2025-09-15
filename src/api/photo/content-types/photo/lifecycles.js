'use strict';

/**
 * photo lifecycle callbacks
 */

module.exports = {
  async beforeUpdate(event) {
    const { data, where } = event.params;
    
    try {
      // If status is being changed, automatically set the appropriate timestamp
      if (data.status && where.id) {
        // @ts-ignore
        const currentPhoto = await strapi.entityService.findOne('api::photo.photo', where.id);
        
        // @ts-ignore
        if (currentPhoto && currentPhoto.status !== data.status) {
          // @ts-ignore
          console.log(`📸 Photo ${where.id} status changing from ${currentPhoto.status} to ${data.status}`);
          
          // Status is changing, set the appropriate timestamp
          if (data.status === 'approved') {
            data.approved_at = new Date();
            // Clear rejected fields if approving
            data.rejected_at = null;
            data.rejection_reason = null;
            console.log(`✅ Photo ${where.id} approved at ${data.approved_at}`);
          } else if (data.status === 'rejected') {
            data.rejected_at = new Date();
            // Clear approved field if rejecting
            data.approved_at = null;
            console.log(`❌ Photo ${where.id} rejected at ${data.rejected_at}`);
          } else if (data.status === 'pending') {
            // Reset both timestamps if going back to pending
            data.approved_at = null;
            data.rejected_at = null;
            data.rejection_reason = null;
            console.log(`⏳ Photo ${where.id} reset to pending`);
          }
        }
      }
    } catch (error) {
      console.error('Error in photo beforeUpdate lifecycle:', error);
      // Don't throw error to prevent blocking the update
    }
  },

  async beforeCreate(event) {
    const { data } = event.params;
    
    try {
      // Set uploaded_at timestamp when creating a new photo
      if (!data.uploaded_at) {
        data.uploaded_at = new Date();
        console.log(`📸 New photo created with uploaded_at: ${data.uploaded_at}`);
      }
      
      // Ensure status is set to pending by default
      if (!data.status) {
        data.status = 'pending';
        console.log(`📸 New photo status set to: ${data.status}`);
      }
    } catch (error) {
      console.error('Error in photo beforeCreate lifecycle:', error);
      // Don't throw error to prevent blocking the creation
    }
  }
};
