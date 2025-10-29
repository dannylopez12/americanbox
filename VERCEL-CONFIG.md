# Vercel Deployment Configuration

## Environment Variables

Configure the following environment variables in your Vercel dashboard:

### Database Configuration
```
DB_HOST=your-hostinger-mysql-host
DB_PORT=3306
DB_USER=your-hostinger-username
DB_PASSWORD=your-hostinger-password
DB_NAME=your-database-name
```

### Application Configuration
```
NODE_ENV=production
```

## API Endpoints

After deployment, the following endpoints will be available:

- `GET/POST /api/test` - Test endpoint to verify API functionality
- `POST /api/login` - User authentication endpoint

## Troubleshooting

1. **404 Error on /api/login**: Ensure the `api/login.js` file exists and is properly configured
2. **Database Connection Error**: Verify all DB_* environment variables are set correctly
3. **CORS Issues**: Check that CORS headers are properly configured in the API functions

## Testing

You can test the API endpoints using:

```bash
# Test API functionality
curl https://your-vercel-url.vercel.app/api/test

# Test login (replace with actual credentials)
curl -X POST https://your-vercel-url.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}'
```