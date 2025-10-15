# Migration Guide: Navigation Bar Update

This guide helps developers migrate from the old sidebar-based navigation to the new header-based navigation system with PostHog analytics integration.

## 🔄 Breaking Changes

### Mock Apollo Service Removed

The entire `mock-apollo/` directory and service has been removed. All Apollo API calls now use the real Apollo API.

**Action Required:**
1. Remove any references to the mock Apollo service from your environment
2. Configure your Apollo API key via the Integrations page (http://localhost:3000/dashboard/integrations)
3. Update any scripts or documentation that referenced `mock-apollo/`
4. Remove Docker configurations for the mock Apollo service

### Navigation System Updated

The application has moved from sidebar navigation to header-based navigation.

**Changes:**
- ❌ Removed: `MainNavigation.tsx` (sidebar component)
- ❌ Removed: `BreadcrumbNavigation.tsx` (old breadcrumb system)
- ✅ Added: `comp-589.tsx` (header navigation)
- ✅ Added: `UniversalBreadcrumb.tsx` (new breadcrumb system)
- ✅ Added: `AppShell.tsx` and `DashboardShell.tsx` (layout components)

**Action Required:**
1. Update any custom pages to use the new `DashboardShell` layout
2. Remove any imports of the old navigation components
3. Update navigation links to use the new header structure

### UI Component Library Updates

All UI components have been updated to use the COSS design system.

**Updated Components:**
- `avatar.tsx`, `badge.tsx`, `breadcrumb.tsx`, `button.tsx`
- `checkbox.tsx`, `dialog.tsx`, `dropdown-menu.tsx`
- `input.tsx`, `label.tsx`, `navigation-menu.tsx`
- `progress.tsx`, `select.tsx`, `table.tsx`, `tabs.tsx`
- `textarea.tsx`

**New Components:**
- `alert-dialog.tsx` - Alert dialogs for confirmations
- `pagination.tsx` - Pagination controls
- `popover.tsx` - Popover menus
- `tooltip.tsx` - Tooltips
- `utils.ts` - Utility functions for components

**Action Required:**
1. Review custom components that use UI primitives
2. Update any custom styling to match the new design system
3. Test all UI interactions

## ✨ New Features

### PostHog Analytics Integration

PostHog analytics has been integrated for user behavior tracking.

**New Files:**
- `frontend/src/lib/posthog.ts` - PostHog initialization
- `frontend/src/lib/analytics.ts` - Analytics helper functions
- `frontend/src/components/providers/PosthogProvider.tsx` - PostHog provider component

**Environment Variables:**
Add to `frontend/.env.local`:
```env
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Usage:**
```typescript
import { captureUiEvent, captureNavigation, captureLandingAction } from '@/lib/analytics';

// Track UI interactions
captureUiEvent('button_click', { button: 'submit', page: 'dashboard' });

// Track navigation
captureNavigation('Dashboard', '/dashboard');

// Track landing page actions
captureLandingAction('signup_started');
```

### Advanced Table Management

New table management components with @tanstack/react-table integration.

**New Files:**
- `frontend/src/components/dashboard/AdvancedTablesView.tsx`
- `frontend/src/components/dashboard/AdvancedTablesViewSkeleton.tsx`
- `frontend/src/components/dashboard/TablesPageAdapter.tsx`
- `frontend/src/components/dashboard/TablesView.tsx`
- `frontend/src/components/tables/TableStats.tsx`
- `frontend/src/lib/tableTransformers.ts`

**Features:**
- Sorting, filtering, and pagination
- Bulk selection and actions
- Row expansion for details
- CSV export functionality
- Real-time updates

### CSV Upload with Drag & Drop

Enhanced file upload functionality with progress tracking.

**New Files:**
- `frontend/src/components/upload/CsvUploadModal.tsx`
- `frontend/src/hooks/use-file-upload.ts`

**Features:**
- Drag and drop file uploads
- Real-time upload progress
- File validation and error handling
- Multiple file support

### Toast Notifications

Sonner library integration for elegant notifications.

**Usage:**
```typescript
import { toast } from 'sonner';

toast.success('Upload complete!');
toast.error('Upload failed. Please try again.');
toast.loading('Uploading file...');
```

## 🛠️ Development Setup Changes

### Backend ESLint Integration

ESLint has been added to the backend for code quality.

**New Files:**
- Backend now includes ESLint configuration

**Commands:**
```bash
cd backend
npm run lint        # Run ESLint
npm run lint:fix    # Auto-fix linting issues
```

### Docker Compose Simplification

The `docker-compose.dev.yml` file has been removed. All development configuration is now in `docker-compose.yml`.

**Action Required:**
1. Remove any references to `docker-compose.dev.yml`
2. Use `docker-compose.yml` for all environments
3. Update your development scripts if needed

### Documentation Updates

Several documentation files have been removed or consolidated:
- ❌ Removed: `BUILD_OPTIMIZATIONS.md`
- ❌ Removed: `DOCKER_OPTIMIZATION.md`
- ❌ Removed: `NETWORKING.md`
- ✅ Updated: `README.md`, `ENVIRONMENT.md`, `DEVELOPMENT.md`, `CONTRIBUTING.md`

## 📋 Migration Checklist

Use this checklist to ensure a smooth migration:

- [ ] Pull latest changes from the `001-navigation-bar` branch
- [ ] Run `npm install` in both `frontend/` and `backend/` directories
- [ ] Update your `.env` files with new PostHog variables (optional)
- [ ] Remove any mock Apollo service references
- [ ] Configure your Apollo API key via the Integrations page
- [ ] Test the new header navigation
- [ ] Test table management features
- [ ] Test CSV upload functionality
- [ ] Verify all UI components render correctly
- [ ] Run linting: `npm run lint` in both frontend and backend
- [ ] Build the project: `npm run build`
- [ ] Test your custom features/pages
- [ ] Update any custom documentation

## 🆘 Troubleshooting

### Build Errors

If you encounter build errors:
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
cd frontend && rm -rf .next
```

### TypeScript Errors

If you see TypeScript errors with new components:
```bash
cd frontend
npx tsc --noEmit
```

### PostHog Not Tracking

If analytics aren't working:
1. Check that `NEXT_PUBLIC_POSTHOG_KEY` is set in `.env.local`
2. Verify the PosthogProvider is wrapping your app in `layout.tsx`
3. Check browser console for PostHog initialization messages

### Navigation Issues

If navigation isn't working:
1. Clear browser cache and cookies
2. Check that the user is authenticated
3. Verify the `AppShell` component is being used
4. Check browser console for errors

## 📚 Additional Resources

- [README.md](./README.md) - Updated project overview
- [ENVIRONMENT.md](./ENVIRONMENT.md) - Environment variables guide
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [PostHog Documentation](https://posthog.com/docs) - Analytics documentation
- [COSS UI Documentation](https://coss.io) - UI component library

## 🙋 Need Help?

If you encounter issues during migration:
1. Check existing [GitHub Issues](https://github.com/getbeton/beton-ai/issues)
2. Create a new issue with the `migration` label
3. Join our community discussions
4. Contact the maintainers

---

**Last Updated:** October 15, 2025  
**Migration Version:** v2.0.0 (Navigation Bar Update)

