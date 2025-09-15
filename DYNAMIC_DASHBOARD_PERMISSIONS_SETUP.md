# Dynamic Dashboard Permissions Setup Guide

This guide explains how to set up permissions for the new dynamic dashboard APIs in the Strapi admin dashboard.

## Accessing Permissions

1. **Login to Strapi Admin Dashboard**
   - Go to `http://localhost:1337/admin` (or your Strapi URL)
   - Login with your admin credentials

2. **Navigate to Settings**
   - Click on **Settings** in the left sidebar
   - Click on **Users & Permissions Plugin** → **Roles**

## Setting Up Roles and Permissions

### 1. Authenticated Users (Public Role)

**For User Layout APIs:**
- Go to **Settings** → **Users & Permissions Plugin** → **Roles**
- Click on **Authenticated** role
- Find **User Layout** section
- Enable the following permissions:
  - ✅ `find` (GET /api/users/me/layout)
  - ✅ `create` (POST /api/users/me/layout)
  - ✅ `delete` (DELETE /api/users/me/layout)
- Click **Save**

### 2. Public Access (Public Role)

**For Admin Widget Configs (Read-only):**
- Go to **Settings** → **Users & Permissions Plugin** → **Roles**
- Click on **Public** role
- Find **Admin Widget Configs** section
- Enable the following permissions:
  - ✅ `find` (GET /api/admin/widget-configs)
  - ✅ `findOne` (GET /api/admin/widget-configs/:widgetId)
- Click **Save**

### 3. Administrator Role

**For Admin Widget Configs (Full Access):**
- Go to **Settings** → **Users & Permissions Plugin** → **Roles**
- Click on **Administrator** role
- Find **Admin Widget Configs** section
- Enable ALL permissions:
  - ✅ `find`
  - ✅ `findOne`
  - ✅ `create`
  - ✅ `update`
  - ✅ `delete`
- Click **Save**

## Content Type Permissions

### User Layout Content Type
1. Go to **Settings** → **Users & Permissions Plugin** → **Roles**
2. Select the role you want to configure
3. Find **User Layout** in the content types list
4. Configure permissions as needed:
   - **Authenticated users**: `find`, `create`, `delete`
   - **Public**: No access (leave all unchecked)

### Admin Widget Configs Content Type
1. Go to **Settings** → **Users & Permissions Plugin** → **Roles**
2. Select the role you want to configure
3. Find **Admin Widget Configs** in the content types list
4. Configure permissions as needed:
   - **Public**: `find`, `findOne` (read-only access)
   - **Administrator**: All permissions

### Widget Control Content Type
1. Go to **Settings** → **Users & Permissions Plugin** → **Roles**
2. Select the role you want to configure
3. Find **Widget Control** in the content types list
4. Configure permissions as needed:
   - **Public**: `find` (read-only access)
   - **Administrator**: All permissions

## Custom Route Permissions

Since we created custom routes, you may need to set up additional permissions:

### 1. User Layout Custom Routes
- **GET /api/users/me/layout**: Requires authentication
- **POST /api/users/me/layout**: Requires authentication
- **DELETE /api/users/me/layout**: Requires authentication

### 2. Admin Widget Configs Custom Routes
- **GET /api/admin/widget-configs**: Public access (for frontend)
- **PUT /api/admin/widget-configs**: Admin only
- **GET /api/admin/widget-configs/:widgetId**: Public access
- **PUT /api/admin/widget-configs/:widgetId**: Admin only

## Step-by-Step Setup Process

### Step 1: Configure Authenticated Role
1. Go to **Settings** → **Users & Permissions Plugin** → **Roles**
2. Click **Authenticated**
3. Scroll down to find **User Layout**
4. Check the following boxes:
   - ✅ `find`
   - ✅ `create`
   - ✅ `delete`
5. Click **Save**

### Step 2: Configure Public Role
1. Go to **Settings** → **Users & Permissions Plugin** → **Roles**
2. Click **Public**
3. Scroll down to find **Admin Widget Configs**
4. Check the following boxes:
   - ✅ `find`
   - ✅ `findOne`
5. Click **Save**

### Step 3: Configure Administrator Role
1. Go to **Settings** → **Users & Permissions Plugin** → **Roles**
2. Click **Administrator**
3. Scroll down to find **Admin Widget Configs**
4. Check ALL boxes:
   - ✅ `find`
   - ✅ `findOne`
   - ✅ `create`
   - ✅ `update`
   - ✅ `delete`
5. Click **Save**

## Testing Permissions

### Test Public Access
```bash
# This should work without authentication
curl http://localhost:1337/api/admin/widget-configs
```

### Test Authenticated Access
```bash
# This should require authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:1337/api/users/me/layout
```

### Test Admin Access
```bash
# This should require admin authentication
curl -X PUT \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"widgetConfigs": {...}}' \
     http://localhost:1337/api/admin/widget-configs
```

## Troubleshooting

### Permission Issues
- **403 Forbidden**: Check if the user has the correct role and permissions
- **401 Unauthorized**: Check if the user is authenticated and has a valid token
- **404 Not Found**: Check if the content type exists and is properly configured

### Content Type Not Showing
- Make sure you've restarted Strapi after creating the new content types
- Check if the content types are properly defined in the schema files
- Verify the API routes are correctly configured

### Custom Routes Not Working
- Check if the custom routes are properly defined in the routes files
- Verify the middleware is correctly configured
- Make sure the controller methods exist and are properly exported

## Security Considerations

1. **User Layout APIs**: Only allow authenticated users to access their own layouts
2. **Admin Widget Configs**: 
   - Read access for public (frontend needs this)
   - Write access only for administrators
3. **Authentication**: Ensure proper JWT token validation
4. **Rate Limiting**: Consider implementing rate limiting for production use

## Production Setup

For production environments:

1. **Enable HTTPS**: Ensure all API calls use HTTPS
2. **CORS Configuration**: Configure CORS properly for your frontend domain
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Monitoring**: Set up monitoring for API usage and errors
5. **Backup**: Regular backups of user layouts and admin configurations

## Quick Setup Checklist

- [ ] Restart Strapi backend
- [ ] Run initialization script: `node scripts/init-dynamic-dashboard.js`
- [ ] Configure Authenticated role permissions for User Layout
- [ ] Configure Public role permissions for Admin Widget Configs (read-only)
- [ ] Configure Administrator role permissions for Admin Widget Configs (full access)
- [ ] Test API endpoints
- [ ] Verify frontend integration works
- [ ] Set up proper authentication in frontend

## Support

If you encounter issues:
1. Check Strapi logs for error messages
2. Verify content type schemas are correct
3. Ensure all required files are in place
4. Test with simple API calls first
5. Check browser network tab for detailed error responses
