# NACOS Platform - Phase 1 Setup Guide

## Overview
This guide explains how to set up the Supabase backend for Phase 1 of the NACOS platform.

---

## Step 1: Run Database Schema

Go to your Supabase Dashboard → SQL Editor and run the contents of `database/schema.sql`.

This will create all necessary tables:
- `students` - Student profiles
- `admin_users` - Admin accounts
- `resource_categories` - Resource categories
- `past_questions` - Past examination questions
- `timetables` - Academic timetables
- `academic_resources` - Links to resources
- `career_paths` - Career path guides

---

## Step 2: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `nacos-assets`
3. Set it to **Public** (for files to be accessible)
4. Configure allowed file types: PDF, JPG, JPEG, PNG

---

## Step 3: Create Admin User

### Option A: Using SQL (Recommended)

Run this SQL in the Supabase SQL Editor:

```sql
-- First, create the auth user (you'll need to do this via Supabase Dashboard → Authentication → Users → Add User)
-- Or use this if you have the user_id from a previously created user:

INSERT INTO admin_users (user_id, name, email, role)
VALUES ('YOUR_USER_UUID_HERE', 'Admin Name', 'admin@example.com', 'super_admin');
```

### Option B: Via the Admin Dashboard

1. Create an account via the student signup flow
2. Go to Supabase Dashboard → Authentication → Users
3. Copy the user's UUID
4. Go to the `admin_users` table and insert a row with that UUID

---

## Step 4: Configure Row Level Security (RLS)

The schema already includes RLS policies, but verify they are enabled:

1. Go to Supabase Dashboard → Table Editor
2. Select each table and check that RLS is enabled
3. Verify the policies under the "Policies" tab

---

## Step 5: Verify Setup

Test the following:

1. **Student Signup**: Register a new student account
2. **Admin Login**: Access `/admin-login.html` with an admin account
3. **Upload Content**: Try uploading a past question via the admin dashboard
4. **View Content**: Verify past questions appear on `/past-questions.html`

---

## File Structure

```
NACOS-Portal-master/
├── assets/
│   ├── js/
│   │   └── supabase-config.js    # Supabase client configuration
├── database/
│   └── schema.sql               # Database schema
├── admin-login.html              # Admin authentication
├── admin-dashboard.html          # Admin content management
├── past-questions.html          # Student view for past questions
├── timetables.html              # Student view for timetables
├── resources.html               # Student view for academic resources
├── career-paths.html            # Career path guides
└── index.html                   # Updated with navigation links
```

---

## Troubleshooting

### "Storage bucket not found"
- Create the `nacos-assets` bucket in Supabase Storage
- Make sure it's set to **Public**

### "Access denied" errors
- Check that RLS policies are correctly set
- Verify the user has the correct role in `admin_users` table

### Files not uploading
- Check that the storage bucket allows the file type
- Verify the file size is under the limit (50MB default)

---

## Next Steps

After Phase 1 is verified working, proceed to Phase 2:
- Enhance Career Paths with full database-backed content
- Add Student Dashboard improvements
- Google Forms/Sheets integration (as you mentioned)