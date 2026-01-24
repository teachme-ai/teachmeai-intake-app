# 🔑 How to Get Your Google Service Account Private Key

## Step-by-Step Guide

### 1️⃣ Go to Google Cloud Console

Open: **https://console.cloud.google.com/**

### 2️⃣ Select Your Project

- Click the project dropdown at the top
- Select your project (or create a new one if you don't have one)

### 3️⃣ Navigate to Service Accounts

**Option A: Direct Link**
- Go to: https://console.cloud.google.com/iam-admin/serviceaccounts

**Option B: Using the Menu**
1. Click the hamburger menu (☰) in the top-left
2. Navigate to: **IAM & Admin** → **Service Accounts**

### 4️⃣ Create or Select a Service Account

#### If you DON'T have a service account yet:

1. Click **+ CREATE SERVICE ACCOUNT** at the top
2. Fill in the details:
   - **Service account name**: `teachmeai-sheets-service` (or any name you prefer)
   - **Service account ID**: Will auto-generate (e.g., `teachmeai-sheets-service`)
   - **Description**: `Service account for TeachMeAI Google Sheets integration`
3. Click **CREATE AND CONTINUE**
4. Grant roles (optional for now, you can skip):
   - You can click **CONTINUE** without selecting a role
5. Click **DONE**

#### If you already have a service account:

- Find it in the list and click on it

### 5️⃣ Create and Download the Private Key

1. Click on your service account email to open its details
2. Go to the **KEYS** tab at the top
3. Click **ADD KEY** → **Create new key**
4. Select **JSON** format (this is important!)
5. Click **CREATE**

**🎉 A JSON file will automatically download to your computer!**

The file will be named something like:
```
your-project-name-abc123def456.json
```

### 6️⃣ What's Inside the JSON File?

Open the file in a text editor. It should look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "teachmeai-sheets-service@your-project.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 7️⃣ Enable Google Sheets API

Before using the service account, you need to enable the Google Sheets API:

1. Go to: https://console.cloud.google.com/apis/library
2. Search for: **Google Sheets API**
3. Click on it
4. Click **ENABLE**

### 8️⃣ Share Your Google Sheet with the Service Account

This is **CRITICAL** - your service account needs permission to access your sheet:

1. Open your Google Sheet
2. Click the **Share** button (top-right)
3. Copy the `client_email` from your JSON file (e.g., `teachmeai-sheets-service@your-project.iam.gserviceaccount.com`)
4. Paste it in the "Add people and groups" field
5. Set permission to **Editor**
6. **UNCHECK** "Notify people" (it's a service account, not a real person)
7. Click **Share**

### 9️⃣ Get Your Google Sheet ID

Your Sheet ID is in the URL:

```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                        ↑_____________THIS_PART_____________↑
```

Copy just the ID part (between `/d/` and `/edit`)

---

## 🚀 Now Configure Vercel

### Method 1: Base64 Encoding (RECOMMENDED)

1. Run this command in your project directory:
   ```bash
   ./encode-service-account.sh ~/Downloads/your-project-abc123.json
   ```

2. Copy the base64 output

3. In Vercel:
   - Go to: **Settings** → **Environment Variables**
   - Add variable:
     - **Name**: `GOOGLE_SERVICE_ACCOUNT_BASE64`
     - **Value**: `<paste the base64 string>`
   - Add variable:
     - **Name**: `GOOGLE_SHEET_ID`
     - **Value**: `<your sheet ID>`

4. Redeploy your app

### Method 2: Individual Variables

In Vercel → Settings → Environment Variables, add each of these:

```
GOOGLE_PROJECT_ID=<from JSON: project_id>
GOOGLE_PRIVATE_KEY_ID=<from JSON: private_key_id>
GOOGLE_PRIVATE_KEY=<from JSON: private_key - copy the ENTIRE value with quotes and \n>
GOOGLE_CLIENT_EMAIL=<from JSON: client_email>
GOOGLE_CLIENT_ID=<from JSON: client_id>
GOOGLE_SHEET_ID=<your sheet ID from URL>
```

**⚠️ IMPORTANT for GOOGLE_PRIVATE_KEY:**
- Copy the ENTIRE value including the quotes
- It should look like: `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`
- Do NOT remove the `\n` characters

---

## ✅ Verification Checklist

- [ ] Service account created in Google Cloud Console
- [ ] Private key JSON file downloaded
- [ ] Google Sheets API enabled
- [ ] Google Sheet shared with service account email (Editor access)
- [ ] Environment variables added to Vercel
- [ ] App redeployed in Vercel

---

## 🆘 Troubleshooting

**Problem**: Can't find Service Accounts in the menu
- **Solution**: Make sure you've selected a project at the top of the console

**Problem**: "Permission denied" error
- **Solution**: Make sure you shared the sheet with the service account email

**Problem**: "API not enabled" error
- **Solution**: Enable the Google Sheets API in the APIs & Services section

**Problem**: Still getting decoder error
- **Solution**: Use the base64 method instead of individual variables

---

## 📚 Quick Links

- Google Cloud Console: https://console.cloud.google.com/
- Service Accounts: https://console.cloud.google.com/iam-admin/serviceaccounts
- APIs Library: https://console.cloud.google.com/apis/library
- Google Sheets API: https://console.cloud.google.com/apis/library/sheets.googleapis.com

---

Need more help? Check `QUICK_FIX.md` or `GOOGLE_SHEETS_FIX.md` in this repository!
