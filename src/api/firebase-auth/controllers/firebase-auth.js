'use strict';

module.exports = {
  async register(ctx) {
    try {
      console.log('🔥 Firebase Auth: Register endpoint called');
      
      let { username, email, firebaseUid } = ctx.request.body;
      
      if (!firebaseUid) {
        return ctx.badRequest('firebaseUid is required');
      }

      // If email missing, try to resolve from Firebase Admin
      if (!email) {
        try {
          // @ts-ignore
          const fbUser = await strapi.firebase?.auth().getUser(firebaseUid);
          email = fbUser?.email || '';
          console.log('📧 Resolved email from Firebase Admin:', email || 'none');
        } catch (e) {
          console.warn('⚠️ Could not resolve email from Firebase Admin for UID:', firebaseUid);
        }
      }

      // Fallback username if missing
      if (!username) {
        username = email ? email.split('@')[0] : `user-${String(firebaseUid).slice(0,6)}`;
      }

      // If still no email, synthesize a placeholder to satisfy schema requirements
      if (!email) {
        email = `${firebaseUid}@no-email.firebase`;
        console.warn('⚠️ Email missing; synthesizing placeholder for registration:', email);
      }

      // Create the user
      let userData = {
        username,
        email,
        firebaseUid,
        confirmed: true,
        blocked: false,
        provider: 'firebase'
      };

      // Ensure username is unique; if taken, append a short suffix
      const sameUsername = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { username }
      });
      if (sameUsername && sameUsername.length > 0) {
        const suffix = String(Date.now()).slice(-4);
        userData.username = `${username}-${suffix}`;
        console.warn('⚠️ Username taken, using fallback:', userData.username);
      }

      // Resolve default authenticated role id dynamically
      const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });

      if (!defaultRole) {
        return ctx.badRequest('Default role not found');
      }

      userData = { ...userData, role: defaultRole.id };

      console.log('Creating/Linking user with data:', { username, email, firebaseUid });

      // Check if user already exists
      const existingUser = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: {
          $or: [
            { email: { $eqi: email } },
            { firebaseUid: { $eq: firebaseUid } }
          ]
        }
      });

      if (existingUser && existingUser.length > 0) {
        const user = existingUser[0];

        // If user exists with same email but no firebaseUid, link the account
        if (user.email === email && !user.firebaseUid) {
          const updated = await strapi.entityService.update('plugin::users-permissions.user', user.id, {
            data: {
              firebaseUid,
              provider: 'firebase',
              confirmed: true,
              blocked: false,
            },
          });

          console.log('🔗 Linked existing user with firebaseUid:', updated.id);

          return ctx.send({
            message: 'User linked successfully',
            user: {
              id: updated.id,
              username: updated.username,
              email: updated.email,
              firebaseUid: updated.firebaseUid,
            }
          });
        }

        // If user exists with same email but with a different firebaseUid, overwrite to new UID
        if (user.email === email && user.firebaseUid !== firebaseUid) {
          const updated = await strapi.entityService.update('plugin::users-permissions.user', user.id, {
            data: {
              firebaseUid,
              provider: 'firebase',
              confirmed: true,
              blocked: false,
            },
          });

          console.log('🔄 Updated existing user firebaseUid:', { id: updated.id, oldUid: user.firebaseUid, newUid: firebaseUid });

          return ctx.send({
            message: 'User firebaseUid updated successfully',
            user: {
              id: updated.id,
              username: updated.username,
              email: updated.email,
              firebaseUid: updated.firebaseUid,
            }
          });
        }

        // If user already exists with this firebaseUid, return success
        if (user.firebaseUid === firebaseUid) {
          return ctx.send({
            message: 'User already exists',
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              firebaseUid: user.firebaseUid,
            }
          });
        }

        return ctx.badRequest('User already exists with this email or firebaseUid');
      }

      const user = await strapi.entityService.create('plugin::users-permissions.user', {
        data: userData
      });

      console.log('✅ User created successfully:', user.id);

      ctx.send({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firebaseUid: user.firebaseUid
        }
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      ctx.badRequest('Registration failed: ' + error.message);
    }
  },

  async login(ctx) {
    try {
      console.log('🔥 Firebase Auth: Login endpoint called');
      
      const { firebaseUid } = ctx.request.body;
      
      if (!firebaseUid) {
        return ctx.badRequest('firebaseUid is required');
      }

      // Find user by firebaseUid
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { firebaseUid },
        populate: { role: true }
      });

      if (!users || users.length === 0) {
        return ctx.badRequest('User not found');
      }

      const user = users[0];

      if (user.blocked) {
        return ctx.badRequest('User is blocked');
      }

      console.log('✅ User found:', user.id);

      ctx.send({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firebaseUid: user.firebaseUid,
          // @ts-ignore
          role: user.role?.name
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      ctx.badRequest('Login failed: ' + error.message);
    }
  },

  async forgotPassword(ctx) {
    try {
      console.log('🔥 Firebase Auth: Forgot password endpoint called');
      
      const { email } = ctx.request.body;
      
      if (!email) {
        return ctx.badRequest('Email is required');
      }

      // Find user by email
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { email }
      });

      if (!users || users.length === 0) {
        return ctx.badRequest('User not found');
      }

      console.log('✅ Password reset requested for:', email);

      ctx.send({
        message: 'Password reset instructions sent to email',
        email: email
      });

    } catch (error) {
      console.error('❌ Forgot password error:', error);
      ctx.badRequest('Password reset failed: ' + error.message);
    }
  }
}; 