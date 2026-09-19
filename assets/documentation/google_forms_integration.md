# Google Forms/Sheets Integration Guide

This guide explains how to automatically register students from Google Forms submissions to the NACOS platform.

---

## Architecture Overview

```
Google Form → Google Sheets → Apps Script → Netlify Webhook → Supabase Database
```

---

## Step 1: Create Your Google Form

Create a Google Form with these fields:
- Full Name (text)
- Email (email)
- Matric Number (text)
- Course (dropdown or text)
- Department (text - optional)

---

## Step 2: Connect Form to Google Sheets

1. Open your Google Form
2. Click on "Responses" tab
3. Click on "Create Spreadsheet" → "Create a new spreadsheet"
4. Name your spreadsheet (e.g., "NACOS Student Registrations")

---

## Step 3: Set Up Apps Script Webhook

1. In your Google Sheets, go to **Extensions → Apps Script**
2. Replace the default code with:

```javascript
function onFormSubmit(e) {
  const formData = e.values;

  // Map form fields to your data structure
  // Adjust indices based on your form structure
  const payload = {
    name: formData[1],
    email: formData[2],
    matric_no: formData[3],
    course: formData[4],
    department: formData[5] || null
  };

  const webhookUrl = 'https://YOUR_NETLIFY_SITE.netlify.app/.netlify/functions/google-form-webhook';

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  };

  try {
    const response = UrlFetchApp.fetch(webhookUrl, options);
    Logger.log('Response: ' + response.getContentText());
  } catch (error) {
    Logger.log('Error: ' + error.toString());
  }
}
```

3. Click **Edit → Current project's triggers**
4. Click **+ Add Trigger**
5. Configure:
   - Function: `onFormSubmit`
   - Deployment: Head
   - Event source: From spreadsheet
   - Event type: On form submit

---

## Step 4: Deploy Netlify Function

The function `netlify/functions/google-form-webhook.js` is already created.

Set these environment variables in Netlify:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key

---

## Step 5: Test the Integration

1. Submit a test entry through your Google Form
2. Check your Supabase `Students` table for the new record
3. Check Netlify function logs for any errors

---

## Alternative: Direct Google Forms Webhook (No Code)

If you prefer not to use Apps Script:

1. Use a service like **Make (Integromat)** or **Zapier**
2. Connect Google Forms to the webhook URL
3. Map form fields to the JSON payload

### Webhook URL Format:
```
https://YOUR_NETLIFY_SITE.netlify.app/.netlify/functions/google-form-webhook
```

### JSON Payload Format:
```json
{
  "name": "John Doe",
  "email": "john.doe@student.tau.edu.ng",
  "matric_no": "MSS/2023/001",
  "course": "Computer Science",
  "department": "Computing"
}
```

---

## Troubleshooting

### Form submissions not appearing in Supabase
1. Check Netlify function logs for errors
2. Verify environment variables are set correctly
3. Test the webhook URL directly with curl or Postman

### CORS errors
The Netlify function includes CORS headers for browser requests.

### Duplicate entries
The function checks for existing email/matric_no before inserting.

---

## Security Notes

- The webhook currently accepts requests from any source
- For production, consider adding a shared secret key:
  1. Add `WEBHOOK_SECRET` to Netlify environment variables
  2. Include it in the request header: `X-Webhook-Secret: YOUR_SECRET`
  3. Verify it in the function before processing