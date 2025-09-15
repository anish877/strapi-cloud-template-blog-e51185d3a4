module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '30d', // Strapi JWT expiration (for fallback)
      },
      register: {
        allowedFields: ['firebaseUid'], // Allow firebaseUid during registration
      },
      // Custom callback validator for additional security
      callback: {
        validate: (cbUrl, options) => {
          // Add your custom validation logic here
          const allowedOrigins = [
            env('CLIENT_URL', 'http://localhost:3000'),
            env('ADMIN_URL', 'http://localhost:1337'),
          ];
          
          const isValidOrigin = allowedOrigins.some(origin => 
            cbUrl.startsWith(origin)
          );
          
          if (!isValidOrigin) {
            throw new Error('Invalid callback URL');
          }
        },
      },
    },
  },
});
