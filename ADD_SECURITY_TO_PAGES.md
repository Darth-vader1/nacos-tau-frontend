# Add Security Module to All Pages

## Quick Guide

Add this line to the `<head>` or before closing `</body>` tag of each HTML file:

```html
<script src="assets/js/security.js"></script>
```

**IMPORTANT**: Must load BEFORE `api-config.js` and any API calls.

---

## Pages to Update

### ✅ Already Updated
- [x] `index.html`

### 🔄 Need to Update

1. **`admin-dashboard.html`**
   - Location: Before `</body>`
   - After: Other script tags

2. **`student-dashboard.html`**
   - Location: Before `</body>`
   - After: Other script tags

3. **`student-signup.html`**
   - Location: Before `</body>`
   - After: Other script tags

4. **`events-archive.html`**
   - Location: Before `</body>`
   - After: Other script tags

5. **`past-questions.html`**
   - Location: Before `</body>`
   - After: Other script tags

6. **`career-paths.html`**
   - Location: Before `</body>`
   - After: Other script tags

7. **`voting.html`** (if exists)
   - Location: Before `</body>`
   - After: Other script tags

8. **Any other pages with forms/API calls**

---

## Template

Find this section in each HTML file:

```html
<!-- Existing scripts -->
<script src="assets/js/env.js"></script>
<script type="module" src="assets/js/supabase-config.js"></script>
<script type="module" src="assets/js/api-config.js"></script>
```

Change to:

```html
<!-- Existing scripts -->
<script src="assets/js/env.js"></script>
<script src="assets/js/security.js"></script>  <!-- ADD THIS LINE -->
<script type="module" src="assets/js/supabase-config.js"></script>
<script type="module" src="assets/js/api-config.js"></script>
```

---

## Verification

After adding to each page, open in browser and check console:

✅ **Expected**:
```
🔒 Security module loaded
ℹ️  CSRF protection not enabled on backend
✅ Security Manager initialized
```

❌ **Error** (if security.js not loaded):
```
Uncaught ReferenceError: securityManager is not defined
```

---

## Testing

1. **Open page in browser**
2. **Open DevTools Console** (F12)
3. **Look for**: "🔒 Security module loaded"
4. **Test a form** (if applicable)
5. **Check Network tab**: Requests should work normally

---

## Bulk Update Command (Optional)

If comfortable with command line:

```bash
# In frontend directory
# This is just a reference - review each file manually for safety

# For each HTML file, add the security script
# Review carefully before running!
```

**Recommendation**: Update manually to ensure correct placement.

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify `security.js` file exists
3. Check file path is correct (`assets/js/security.js`)
4. Ensure script loads before API calls

