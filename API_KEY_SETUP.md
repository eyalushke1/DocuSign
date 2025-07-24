# API Key Setup Guide

## The Problem
You're seeing this error: `Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}`

This happens because the PDF extraction system needs a valid AI API key to analyze and extract data from your documents.

## Quick Fix Steps

### Option 1: Anthropic Claude (Recommended for document analysis)

1. **Get your API key**:
   - Go to https://console.anthropic.com/
   - Sign up or log in
   - Navigate to "API Keys" 
   - Click "Create Key"
   - Copy the key (starts with `sk-ant-`)

2. **Add it to your .env file**:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```

3. **Restart the server**:
   ```bash
   npm run dev
   ```

### Option 2: OpenAI GPT-4 (Alternative)

1. **Get your API key**:
   - Go to https://platform.openai.com/api-keys
   - Sign up or log in
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

2. **Add it to your .env file**:
   ```bash
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

3. **Restart the server**:
   ```bash
   npm run dev
   ```

## Verify Your Setup

Run this command to check if your API keys are configured correctly:
```bash
node check_api_keys.js
```

You should see:
```
✅ At least one valid API key is configured
🚀 PDF extraction should work
```

## Important Notes

- **You only need ONE API key** (either Anthropic OR OpenAI)
- **Anthropic Claude is recommended** for document analysis tasks
- **Don't share your API keys** - keep them private
- **API usage costs money** - check the pricing on each platform
- **The .env file is ignored by git** - your keys won't be committed

## Cost Information

- **Anthropic Claude**: ~$0.01-0.03 per document (depending on size)
- **OpenAI GPT-4**: ~$0.02-0.06 per document (depending on size)

For typical CoF documents, expect costs of 1-3 cents per PDF processed.

## Troubleshooting

### Still getting 401 errors?
- Check that your API key doesn't contain "placeholder" text
- Verify the key format (Anthropic: `sk-ant-...`, OpenAI: `sk-...`)
- Make sure you restarted the server after updating .env
- Run `node check_api_keys.js` to verify

### Server not starting?
- Check your .env file syntax (no spaces around =)
- Make sure the .env file is in the root directory
- Verify no special characters are breaking the key

### API key not working?
- Generate a new key from the respective platform
- Check your account has credits/billing set up
- Verify the key has the right permissions

## Testing Your Setup

Once configured, try extracting data from a PDF:
1. Start the server: `npm run dev`
2. Open http://localhost:3002
3. Select a folder with PDF files
4. Choose "CoF" document type
5. Click "Start Extraction"
6. You should see data extracted instead of errors

## Need Help?

If you're still having issues:
1. Run `node check_api_keys.js` and share the output
2. Check the server console for detailed error messages
3. Verify your API key works by testing it directly on the provider's platform