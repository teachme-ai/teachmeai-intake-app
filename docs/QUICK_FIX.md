# 🚀 Quick Fix: Google Sheets Decoder Error

## The Problem
```
❌ Google Sheets: Save failed: error:1E08010C:DECODER routines::unsupported
```

## The Solution (Choose ONE)

### ✅ Method 1: Base64 Encoding (RECOMMENDED - Most Reliable)

1. **Encode your service account:**
   ```bash
   ./encode-service-account.sh path/to/your-service-account.json
   ```

2. **Copy the output and add to Vercel:**
   - Go to Vercel → Settings → Environment Variables
   - Add: `GOOGLE_SERVICE_ACCOUNT_BASE64` = `<paste the base64 string>`
   - Add: `GOOGLE_SHEET_ID` = `<your sheet ID>`

3. **Redeploy**

---

### ⚠️ Method 2: Individual Variables (If Method 1 Doesn't Work)

Add these to Vercel Environment Variables:

```
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=abc123...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=123456789...
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

**IMPORTANT for GOOGLE_PRIVATE_KEY:**
- Copy the ENTIRE value from the JSON file
- Include the quotes and `\n` characters EXACTLY as they appear
- Should look like: `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`

---

## 📋 Checklist

- [ ] Service account JSON downloaded from Google Cloud
- [ ] Google Sheets API enabled in Google Cloud Console
- [ ] Sheet shared with service account email (Editor access)
- [ ] Environment variables added to Vercel
- [ ] App redeployed in Vercel
- [ ] Logs checked for success messages

## 🔍 Verify It's Working

Check Vercel logs for:

**✅ Success:**
```
✅ Google Sheets: Private key formatted successfully
✅ Google Sheets: Data saved successfully!
```

**❌ Still failing:**
```
❌ Google Sheets: Private key does not contain BEGIN/END markers
```
→ The private key is not formatted correctly. Try Method 1 (base64).

## 🆘 Need Help?

See the full guide: `GOOGLE_SHEETS_FIX.md`
