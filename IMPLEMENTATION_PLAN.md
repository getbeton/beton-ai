# Fix Tables Not Uploading - Authentication & Supabase Client Issue

## Root Cause Analysis

### Primary Issue: Duplicate Supabase Client Instances

**Current State (main branch):**
The frontend creates **two separate Supabase client instances**, causing authentication state inconsistency:

1. **`frontend/src/lib/api.ts` (lines 4-7):** Creates its own Supabase client
2. **`frontend/src/lib/supabase.ts` (lines 1-10):** Creates another simple Supabase client

**Why This Breaks Table Upload:**
1. User logs in → session stored in `supabase.ts` client instance
2. API interceptor in `api.ts` uses **different** Supabase instance to get session
3. Session not found in duplicate instance → No `Authorization: Bearer` header attached
4. Backend receives request without auth token → Returns **401 Unauthorized**
5. Tables cannot be uploaded or fetched

**Evidence from Code Investigation:**
- API upload endpoint: `POST /api/tables/upload-csv` (backend/src/routes/tables.ts:1340-1615)
- Protected by `authMiddleware` that requires valid JWT token
- Frontend sends request via `fetch` with manually attached Bearer token
- Token retrieved from **duplicate** Supabase instance → often invalid/missing

**Additional Issues:**
- `supabase.ts` lacks proper auth configuration (no `persistSession`, `autoRefreshToken`)
- Auto-redirect to `/auth` on 401 errors creates poor UX
- No development mode bypass for local testing

### Secondary Issue: Database Was Being Wiped on Every Deploy

**Fixed in previous commit (9574835):**
- `backend/start.sh` was running `DROP SCHEMA public CASCADE` on every deployment
- This deleted all users, tables, and data
- Already fixed by removing destructive reset from deployment script

## Solution: Apply Working Fix from 002-webhooks Branch

The `002-webhooks` branch (commit `3d5098b`) contains the complete working fix for authentication issues.

### Changes Required

#### 1. Fix `frontend/src/lib/supabase.ts`
**Current (main):**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Fixed (002-webhooks):**
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type Database = {
  // Add your database types here if needed
}

// Singleton pattern to ensure only one Supabase client instance
let supabaseInstance: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
```

**Key Improvements:**
- Singleton pattern prevents multiple instances
- `persistSession: true` - Stores session in localStorage
- `autoRefreshToken: true` - Automatically refreshes expired tokens
- `detectSessionInUrl: true` - Handles OAuth redirects

#### 2. Fix `frontend/src/lib/api.ts`
**Current (main) - Lines 1-7:**
```typescript
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Fixed (002-webhooks):**
```typescript
import axios from 'axios';
import { supabase } from './supabase';  // Import centralized client
```

**Key Change:**
- Remove duplicate Supabase client creation
- Import centralized singleton from `./supabase`

#### 3. Improve Error Handling in `frontend/src/lib/api.ts`
**Current (main) - Lines 30-39:**
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);
```

**Fixed (002-webhooks):**
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Disabled: auto-redirect to auth was causing issues
      // Users should handle authentication errors explicitly in their components
      console.warn('Authentication required - 401 error received');
    }
    return Promise.reject(error);
  }
);
```

**Key Change:**
- Remove auto-redirect to `/auth` on 401 errors
- Log warning instead, let components handle auth errors
- Prevents infinite redirect loops

#### 4. Add Development Mode Support (Optional but Recommended)
**Add to request interceptor in `frontend/src/lib/api.ts`:**
```typescript
api.interceptors.request.use(async (config) => {
  // In development mode, skip Supabase auth check
  if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    // Backend will inject mock user in development
    return config;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});
```

## Implementation Plan

### Phase 1: Create Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b fix/table-upload-authentication
```

### Phase 2: Apply Frontend Fixes

**Step 1: Update `frontend/src/lib/supabase.ts`**
- Replace entire file content with singleton pattern implementation
- Add proper auth configuration (persistSession, autoRefreshToken, detectSessionInUrl)
- Add TypeScript types for Database

**Step 2: Update `frontend/src/lib/api.ts`**
- Remove lines 2-7 (duplicate Supabase client creation)
- Add import: `import { supabase } from './supabase';`
- Update response interceptor to remove auto-redirect
- Optionally add development mode bypass

### Phase 3: Testing & Verification

**Local Testing:**
1. Start development environment
2. Clear browser localStorage and cookies
3. Test authentication flow:
   - Register new account
   - Log in with existing account
   - Verify session persists after page reload
4. Test table upload:
   - Upload CSV file
   - Verify table appears in table list
   - Open table detail page and verify data loads
5. Check browser console:
   - Should NOT see "Multiple GoTrueClient instances" warning
   - Should NOT see authentication errors
6. Check Network tab:
   - Verify `Authorization: Bearer <token>` header on API requests
   - Verify 200 OK responses (not 401)

**Production Testing (after deploy):**
1. Log in with v@getbeton.ai
2. Upload a test CSV table
3. Verify table appears in dashboard
4. Navigate to table detail page
5. Verify all table operations work (fetch rows, pagination, sorting)

### Phase 4: Commit and Push

```bash
# Stage changes
git add frontend/src/lib/supabase.ts frontend/src/lib/api.ts

# Commit with descriptive message
git commit -m "fix(frontend): eliminate duplicate Supabase client instances

CRITICAL: The frontend was creating two separate Supabase client instances:
1. One in api.ts (for API interceptor)
2. Another in supabase.ts (for auth components)

This caused authentication state inconsistency where:
- Users logged in via supabase.ts client
- API interceptor checked session from duplicate api.ts client
- Session not found in duplicate → no Bearer token attached
- Backend returned 401 → tables couldn't upload or fetch

Fixed by:
- Implementing singleton pattern in supabase.ts
- Adding proper auth config (persistSession, autoRefreshToken)
- Making api.ts import centralized supabase client
- Removing auto-redirect on 401 errors (better UX)
- Adding development mode bypass

This fix has been tested and verified in 002-webhooks branch.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to origin
git push origin fix/table-upload-authentication
```

### Phase 5: Deploy to Railway

**Option 1: Merge to Main**
```bash
git checkout main
git merge fix/table-upload-authentication
git push origin main
```

**Option 2: Deploy Branch Directly (Recommended for Testing)**
1. Go to Railway dashboard
2. Change deployment branch to `fix/table-upload-authentication`
3. Wait for deployment to complete
4. Test in production
5. If successful, merge to main

### Phase 6: Post-Deployment Verification

**After Railway deployment completes:**

1. **Clear Database** (if needed):
   - Since previous deploys wiped the database, users need to re-register
   - v@getbeton.ai account may not exist anymore
   - User should register a new account or re-register existing email

2. **Test Authentication:**
   - Navigate to production URL
   - Register/login with v@getbeton.ai
   - Verify session persists across page reloads
   - Check localStorage for `supabase.auth.token`

3. **Test Table Upload:**
   - Click "Upload CSV" button
   - Select a CSV file (< 10MB)
   - Wait for upload to complete
   - Verify success message appears
   - Verify table appears in table list

4. **Test Table Fetching:**
   - Navigate to `/dashboard/tables`
   - Verify all uploaded tables appear
   - Click into a table
   - Verify rows load correctly
   - Test pagination, sorting, filtering

5. **Monitor Logs:**
   ```bash
   railway logs --service frontend
   railway logs --service backend
   ```
   - Check for authentication errors
   - Check for 401 errors
   - Verify successful table upload requests

## Files to Modify

### Critical Files (Must Change):
1. **`frontend/src/lib/supabase.ts`** - Implement singleton with proper auth config
2. **`frontend/src/lib/api.ts`** - Remove duplicate client, import centralized one

### Related Files (Read-Only Context):
- `backend/src/middleware/auth.ts` - Auth middleware that validates JWT
- `backend/src/routes/tables.ts` - Table upload endpoint
- `backend/start.sh` - Already fixed (no longer drops database)
- `frontend/src/app/dashboard/page.tsx` - Table upload UI component

## Expected Outcome

**After Fix:**
- ✅ Single Supabase client instance throughout frontend
- ✅ Consistent authentication state across all components
- ✅ Bearer tokens properly attached to all API requests
- ✅ Tables can be uploaded successfully
- ✅ Tables can be fetched and displayed
- ✅ Session persists across page reloads
- ✅ No more "Multiple GoTrueClient instances" warnings
- ✅ No more 401 errors during normal operation

## Risk Assessment

**Low Risk:**
- Fix has already been tested in `002-webhooks` branch
- Changes are isolated to 2 frontend files
- No backend changes required
- No database migrations needed
- Can easily revert if issues occur

## Alternative Approaches

### Alternative 1: Cherry-Pick from 002-webhooks
```bash
git checkout main
git cherry-pick 3d5098b  # Commit that fixed duplicate clients
```
**Pros:** Fastest approach, proven fix
**Cons:** May include unrelated changes from 002-webhooks

### Alternative 2: Merge Entire 002-webhooks Branch
```bash
git checkout main
git merge 002-webhooks
```
**Pros:** Gets all working features from 002-webhooks
**Cons:** May include webhook features not ready for production

### Recommended: Manual Application (Phase 2 above)
**Pros:**
- Clean implementation
- Only includes authentication fix
- Easy to review and understand
- Full control over what changes

**Cons:**
- Requires manual code changes

## Related Commits

- **`3d5098b`** (002-webhooks) - "fix(frontend): eliminate duplicate Supabase client instances"
- **`73d98bc`** (002-webhooks) - "fix(frontend): disable automatic redirect to /auth on 401 errors"
- **`9574835`** (main, just fixed) - "fix(backend): remove destructive database schema reset from deployment script"

## Post-Fix: Database State

**Important Note:**
Since the previous deployments were dropping the database schema on every deploy (fixed in commit `9574835`), the current production database may be empty or in an inconsistent state.

**User Actions Required After Fix:**
1. **Re-register account** - v@getbeton.ai may not exist in current database
2. **Re-upload tables** - Any previously uploaded tables were deleted
3. **Verify all data** - Double-check that uploaded data persists after deployments

**Database should now:**
- Persist data across deployments
- Maintain user accounts
- Keep uploaded tables and rows
- No longer reset on every deploy
