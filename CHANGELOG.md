# Changelog

All notable changes to Beton-AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-10-15

### 🎉 Major Release: Navigation & Analytics Update

This release represents a significant architectural update with a complete UI/UX overhaul, analytics integration, and removal of technical debt.

### Added

#### Frontend Features
- **Header-based Navigation** - Modern top navigation bar (comp-589) replacing sidebar navigation
- **PostHog Analytics Integration** - Comprehensive user behavior tracking
  - Analytics helper functions (`captureUiEvent`, `captureNavigation`, `captureLandingAction`)
  - PosthogProvider component for app-wide analytics
  - Event tracking across all interactive components
- **Advanced Table Management** - Powered by @tanstack/react-table
  - Sortable columns with multi-column support
  - Advanced filtering and search
  - Pagination controls
  - Bulk selection and actions
  - Row expansion for detailed views
  - CSV export functionality
- **CSV Upload with Drag & Drop** - Enhanced file upload experience
  - Drag and drop interface
  - Real-time upload progress tracking
  - File validation and error handling
  - Multiple file support
- **Toast Notifications** - Sonner library integration for elegant user feedback
- **New UI Components**
  - Alert Dialog component for confirmations
  - Pagination component
  - Popover component
  - Tooltip component
  - Table statistics component
- **Layout System** - AppShell and DashboardShell components for consistent layouts
- **Navigation Components**
  - UniversalBreadcrumb for dynamic breadcrumbs
  - BackButton component
  - User menu with settings
  - Settings menu component
- **Utility Libraries**
  - `tableTransformers.ts` - Data transformation utilities
  - `analytics.ts` - Analytics helper functions
  - `posthog.ts` - PostHog initialization
  - `debug.ts` - Debug utilities
  - `utils.ts` - UI component utilities
- **Custom Hooks**
  - `use-file-upload.ts` - File upload hook with progress tracking

#### Backend Features
- **ESLint Integration** - Added ESLint and TypeScript ESLint plugins for code quality
- **Enhanced Logging** - Improved logging across services for better debugging

#### COSS UI Components
All UI components updated to latest COSS design system:
- Avatar, Badge, Breadcrumb, Button
- Checkbox, Dialog, Dropdown Menu
- Input, Label, Navigation Menu
- Progress, Select, Table, Tabs
- Textarea

#### Documentation
- `MIGRATION_GUIDE.md` - Comprehensive migration guide for developers
- `CHANGELOG.md` - This changelog file
- Updated `README.md` with new features and tech stack
- Updated `ENVIRONMENT.md` with PostHog configuration
- Updated `DEVELOPMENT.md` with Railway CLI best practices
- Updated `CONTRIBUTING.md` with new coding guidelines

### Changed

#### UI/UX Overhaul
- **Navigation** - Migrated from sidebar to header-based navigation
- **Dashboard** - Completely redesigned dashboard with unified table view
- **Landing Page** - Refreshed landing page design and messaging
- **Empty States** - Updated empty state designs across the application
- **Global Styles** - Overhauled CSS with new design system
- **Tailwind Configuration** - Updated for new design system

#### Component Architecture
- Consolidated table management components
- Refactored TableDashboard for better UX
- Updated all pages to use new layout system
- Improved modal handling across the application

#### Backend Updates
- Simplified Apollo configuration
- Updated Apollo router to use only real API endpoints
- Enhanced error handling

#### Development Workflow
- Consolidated Docker configurations
- Updated development scripts
- Improved build process

### Removed

#### Deprecated Services
- **Mock Apollo Service** - Completely removed `mock-apollo/` directory
  - Removed mock API endpoints
  - Removed breadcrumb caching service
  - Removed seed data service
  - Removed mock database schema
  - Removed all Docker configurations for mock service
  - Removed Railway configuration for mock service

#### Deprecated Components
- `MainNavigation.tsx` - Replaced by header navigation
- `BreadcrumbNavigation.tsx` - Replaced by UniversalBreadcrumb
- `TableRowComponent.tsx` - Replaced by new table components
- Jobs page (`/dashboard/jobs/page.tsx`) - Functionality integrated elsewhere

#### Deprecated Documentation
- `BUILD_OPTIMIZATIONS.md` - Content consolidated into other docs
- `DOCKER_OPTIMIZATION.md` - Content consolidated into other docs
- `NETWORKING.md` - Content consolidated into other docs

#### Deprecated Configuration
- `docker-compose.dev.yml` - Merged into main docker-compose.yml
- Mock Apollo config files

### Fixed
- Modal state management issues in TableDashboard
- Upload progress tracking accuracy
- Navigation state persistence
- Form validation edge cases
- Responsive design issues on mobile devices

### Security
- Enhanced API key validation
- Improved authentication flow
- Secure environment variable handling
- PostHog data privacy configuration

### Performance
- Optimized table rendering with virtualization
- Reduced bundle size by removing unused dependencies
- Improved lazy loading for components
- Enhanced caching strategies

### Migration Notes

⚠️ **Breaking Changes**: This release includes breaking changes. Please read the [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) before upgrading.

**Key Migration Steps:**
1. Remove all references to `mock-apollo/` service
2. Configure Apollo API key via Integrations page
3. Update environment variables with PostHog configuration (optional)
4. Update custom pages to use new layout system
5. Run `npm install` in both frontend and backend
6. Run `npm run build` to verify everything works

### Dependencies

#### Frontend
- Added: `posthog-js` - Analytics tracking
- Added: `sonner` - Toast notifications
- Added: `@tanstack/react-table` - Advanced table management
- Added: `@radix-ui/react-alert-dialog` - Alert dialogs
- Added: `@radix-ui/react-tooltip` - Tooltips
- Added: `@radix-ui/react-popover` - Popovers

#### Backend
- Added: `@typescript-eslint/eslint-plugin` - TypeScript linting
- Added: `@typescript-eslint/parser` - TypeScript parser for ESLint
- Added: `eslint` - Code quality tool

---

## [1.0.0] - 2025-09-01

### Initial Release

#### Features
- ✅ Supabase authentication (Google, GitHub, Email/Password)
- ✅ API key management for integrations
- ✅ Apollo API integration
- ✅ OpenAI integration
- ✅ Findymail integration
- ✅ PostgreSQL database with Prisma ORM
- ✅ Redis for job queuing
- ✅ Bull Queue for background jobs
- ✅ Docker containerization
- ✅ Sidebar navigation
- ✅ Basic table management
- ✅ File upload functionality

#### Tech Stack
- Frontend: Next.js 14, TypeScript, TailwindCSS
- Backend: Express.js, TypeScript, Prisma
- Database: PostgreSQL
- Cache/Queue: Redis
- Authentication: Supabase
- Containerization: Docker & Docker Compose

---

## Legend

- 🎉 Major release
- ✨ New feature
- 🔧 Enhancement
- 🐛 Bug fix
- 🔒 Security update
- ⚡ Performance improvement
- 📚 Documentation
- ⚠️ Breaking change
- 🗑️ Deprecation

---

For more information about any release, see the corresponding Git tags and release notes.

