# Clerk Webhook Setup Guide

## Quick Setup (5 minutes)

### 1. Add Webhook Secret to .env.local

Add this line to your `.env.local` file:

```env
CLERK_WEBHOOK_SECRET=whsec_your_secret_here
```

*(You'll get the actual secret in step 3)*

### 2. Expose Your Local Server (Development Only)

**Option A: Using ngrok (Recommended)**
```bash
# Install ngrok from https://ngrok.com/
ngrok http 3000
```

Copy the `https://` URL (e.g., `https://abc123.ngrok-free.app`)

**Option B: Skip for Production**
If deploying to production, skip this step and use your production URL.

### 3. Configure Clerk Webhook

1. Go to https://dashboard.clerk.com/
2. Select your application
3. Click **Webhooks** in sidebar
4. Click **+ Add Endpoint**
5. Enter your endpoint URL:
   - Dev: `https://your-ngrok-url.ngrok-free.app/api/webhooks/clerk`
   - Prod: `https://yourdomain.com/api/webhooks/clerk`
6. Select these events:
   - ✅ `user.created`
   - ✅ `user.updated`
7. Click **Create**
8. **Copy the Signing Secret** (starts with `whsec_`)
9. Paste it in your `.env.local` file from Step 1

### 4. Restart Your Dev Server

```bash
# Stop your current server (Ctrl+C)
# Then restart
npm run dev
```

### 5. Test It!

1. Sign in at `/sign-in` with a new Google account
2. Check Clerk Dashboard → Users → Your User → Metadata
3. Should see: `{ "role": "user" }`
4. Reload your app multiple times - role should persist!

## Troubleshooting

**Webhook not firing?**
- Make sure ngrok is running
- Check that the URL in Clerk matches your ngrok URL exactly
- Verify `CLERK_WEBHOOK_SECRET` is in `.env.local`

**Still having role issues?**
- Clear your browser cache and cookies
- Sign out and sign in again
- Check the webhook logs in Clerk Dashboard

## Production Deployment

When deploying to production:
1. Replace ngrok URL with your production domain
2. Keep the same `CLERK_WEBHOOK_SECRET`
3. Make sure the environment variable is set in your hosting platform
