# Google Sheets Decoder Error Fix

## 🔍 Problem
You're getting the error: `error:1E08010C:DECODER routines::unsupported`

This error occurs when the Google Service Account private key is not properly formatted in Vercel's environment variables.

## 🎯 Root Cause
The error happens because:
1. The private key contains newline characters that need special handling
2. Vercel environment variables may have encoding issues
3. The private key format is not being parsed correctly

## ✅ Solution

### Step 1: Get Your Service Account Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Find your service account (or create one)
4. Click **Keys** → **Add Key** → **Create New Key**
5. Choose **JSON** format and download

### Step 2: Extract Individual Values

Open the downloaded JSON file. It should look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service@project.iam.gserviceaccount.com",
  "client_id": "123456789..."
}
```

### Step 3: Configure Vercel Environment Variables

Go to your Vercel project → **Settings** → **Environment Variables**

Add these variables **EXACTLY** as shown:

#### Option A: Copy the entire private key as-is (RECOMMENDED)

1. **GOOGLE_PRIVATE_KEY**
   - Copy the ENTIRE `private_key` value from the JSON file
   - **IMPORTANT**: Include the quotes and the `\n` characters exactly as they appear
   - Example: `"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"`
   - The value should start with `"-----BEGIN` and end with `-----\n"`

2. **GOOGLE_CLIENT_EMAIL**
   - Copy the `client_email` value (without quotes)
   - Example: `your-service@project.iam.gserviceaccount.com`

3. **GOOGLE_PROJECT_ID**
   - Copy the `project_id` value (without quotes)
   - Example: `your-project-id`

4. **GOOGLE_PRIVATE_KEY_ID**
   - Copy the `private_key_id` value (without quotes)
   - Example: `abc123def456...`

5. **GOOGLE_CLIENT_ID**
   - Copy the `client_id` value (without quotes)
   - Example: `123456789...`

6. **GOOGLE_SHEET_ID**
   - This is the ID from your Google Sheet URL
   - URL format: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - Example: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

#### Option B: If Option A doesn't work, try base64 encoding

If the above doesn't work, you can base64 encode the entire JSON file:

```bash
# On Mac/Linux
cat path/to/your-service-account.json | base64
```

Then in Vercel, add:
- **GOOGLE_SERVICE_ACCOUNT_BASE64**: The base64 string

And update the code to decode it (I can help with this if needed).

### Step 4: Grant Sheet Access

1. Open your Google Sheet
2. Click **Share**
3. Add the `client_email` from your service account
4. Give it **Editor** permissions

### Step 5: Redeploy

After setting all environment variables:
1. Go to Vercel Dashboard
2. Go to **Deployments**
3. Click the **...** menu on the latest deployment
4. Click **Redeploy**

## 🧪 Testing

After redeployment, check the Vercel logs:

**Good signs:**
```
✅ Google Sheets: Private key formatted successfully
✅ Google Sheets: Data saved successfully!
```

**Bad signs:**
```
❌ Google Sheets: Private key does not contain BEGIN/END markers
❌ Google Sheets: Save failed: error:1E08010C:DECODER routines::unsupported
```

## 🔧 Troubleshooting

### If you still get the decoder error:

1. **Verify the private key format:**
   - Open the JSON file in a text editor
   - The `private_key` should contain `\n` (backslash-n), not actual newlines
   - It should be on a single line in the JSON

2. **Check for extra quotes:**
   - When copying to Vercel, don't add extra quotes
   - If the JSON has `"private_key": "VALUE"`, copy only `VALUE`

3. **Try the base64 approach:**
   - This bypasses all encoding issues
   - Let me know if you want to implement this

4. **Check the logs:**
   - Look for the validation messages I added
   - They will tell you exactly what's wrong with the key format

### If the key validates but still fails:

1. **Check API enablement:**
   ```
   - Go to Google Cloud Console
   - APIs & Services → Library
   - Search for "Google Sheets API"
   - Make sure it's ENABLED
   ```

2. **Check permissions:**
   - Make sure the service account email has access to the sheet
   - The sheet must be shared with the service account

3. **Check the Sheet ID:**
   - Make sure `GOOGLE_SHEET_ID` is correct
   - It should NOT include the full URL, just the ID

## 📝 Quick Checklist

- [ ] Downloaded service account JSON
- [ ] Added all 6 environment variables to Vercel
- [ ] Shared Google Sheet with service account email
- [ ] Enabled Google Sheets API in Google Cloud
- [ ] Redeployed the Vercel app
- [ ] Checked Vercel logs for success/error messages

## 🆘 Still Having Issues?

If you're still stuck, share:
1. The Vercel logs (redact any sensitive info)
2. The first few characters of your `GOOGLE_CLIENT_EMAIL`
3. Whether you see the validation messages in the logs

I'll help you debug further!
