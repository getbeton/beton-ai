# Task 1: Table-Centric Dashboard & CSV Upload UI

## Overview
Transform the B2B sales enrichment orchestrator from an integration-focused dashboard to a table-centric interface with seamless CSV upload functionality.

## Goals
- Replace integration-focused dashboard with table management as primary workflow
- Add drag-and-drop CSV upload with automatic table creation
- Leverage existing backend infrastructure (no backend changes required)
- Improve user experience for B2B sales teams managing prospect data

## Phases and Dependencies

### Phase 1: Dashboard Foundation Restructure
- **1.1**: [Move Tables to Primary Dashboard](./1.1-move-tables-to-primary-dashboard.md)
  - Dependencies: None
  - Extract table components, replace integration cards with table list
- **1.2**: [Implement Empty State Design](./1.2-implement-empty-state-design.md)
  - Dependencies: 1.1
  - Create compelling empty state for users with no tables

### Phase 2: CSV Upload Infrastructure (Can Run Parallel)
- **2.1**: [Integrate Drag-and-Drop Library](./2.1-integrate-drag-drop-library.md)
  - Dependencies: None
  - Add react-dropzone library and basic file handling
- **2.2**: [Connect File Upload to Backend](./2.2-connect-file-upload-to-backend.md)
  - Dependencies: 2.1
  - Send uploaded files to existing backend endpoints
- **2.3**: [Implement Upload Progress Tracking](./2.3-implement-upload-progress-tracking.md)
  - Dependencies: 2.2
  - Show detailed progress using existing WebSocket system

### Phase 3: Enhanced Table Management UI
- **3.1**: [Improve Table Card Design](./3.1-improve-table-card-design.md)
  - Dependencies: 1.1
  - Better table cards with clear actions and information
- **3.2**: [Add Bulk Selection for Tables](./3.2-add-bulk-selection-for-tables.md)
  - Dependencies: 3.1
  - Enable multi-table operations using existing patterns
- **3.3**: [Add Search and Filtering](./3.3-add-search-and-filtering.md)
  - Dependencies: 1.1
  - Help users find tables quickly

### Phase 4: Integration and Navigation
- **4.1**: [Integrate Drop Zone with Dashboard](./4.1-integrate-drop-zone-with-dashboard.md)
  - Dependencies: 1.2, 2.3
  - Combine drop zone with dashboard table display
- **4.2**: [Update Navigation and Breadcrumbs](./4.2-update-navigation-and-breadcrumbs.md)
  - Dependencies: All previous
  - Make tables primary navigation destination
- **4.3**: [Polish UX and Error Handling](./4.3-polish-ux-and-error-handling.md)
  - Dependencies: All previous
  - Ensure smooth user experience with proper error handling

### Phase 5: Testing and Documentation
- **5.1**: [Comprehensive Testing and Bug Fixes](./5.1-comprehensive-testing-and-bug-fixes.md)
  - Dependencies: All previous
  - Ensure all functionality works together seamlessly
- **5.2**: [Documentation and Cleanup](./5.2-documentation-and-cleanup.md)
  - Dependencies: 5.1
  - Clean up code and document changes

## Dependency Graph
```
Phase 1: Foundation
├── 1.1 Move Tables to Primary ✓
└── 1.2 Empty State (depends on 1.1)

Phase 2: Upload (parallel)
├── 2.1 Drag-Drop Library ✓
├── 2.2 Backend Connection (depends on 2.1)
└── 2.3 Progress Tracking (depends on 2.2)

Phase 3: Table Management
├── 3.1 Table Cards (depends on 1.1)
├── 3.2 Bulk Selection (depends on 3.1)
└── 3.3 Search/Filter (depends on 1.1)

Phase 4: Integration
├── 4.1 Integrate Drop Zone (depends on 1.2, 2.3)
├── 4.2 Navigation (depends on all previous)
└── 4.3 UX Polish (depends on all previous)

Phase 5: Testing
├── 5.1 Testing (depends on all previous)
└── 5.2 Documentation (depends on 5.1)
```

## Key Architecture Decisions

### Frontend-Only Implementation
- **No Backend Changes**: All implementation leverages existing backend APIs
- **Existing Infrastructure**: Reuse bulk job queue, WebSocket progress, and table APIs
- **UI-Focused**: Transform user experience without changing data models

### Technology Stack
- **react-dropzone**: For drag-and-drop file handling
- **Existing UI Components**: Reuse existing design system and patterns
- **WebSocket Integration**: Extend existing progress tracking for CSV uploads
- **Responsive Design**: Mobile-first approach with existing breakpoints

### Performance Considerations
- **Async Processing**: CSV uploads use existing bulk job queue system
- **Progress Tracking**: Real-time updates via existing WebSocket infrastructure
- **Optimistic UI**: Immediate feedback with rollback on failures
- **Large File Handling**: Leverage existing file size limits and processing

## Success Metrics
1. **User Onboarding**: New users can upload their first CSV within 30 seconds
2. **Table Management**: Existing users see tables as primary dashboard content
3. **Performance**: Dashboard loads in <2 seconds with 100+ tables
4. **Error Handling**: <5% user drop-off rate during CSV upload process
5. **Mobile Experience**: Core functionality works on mobile devices

## Risk Mitigation
- **Backward Compatibility**: All existing functionality remains intact
- **Incremental Deployment**: Each commit can be deployed independently
- **Rollback Plan**: Frontend-only changes allow quick rollbacks
- **Testing Strategy**: Comprehensive testing at each phase

## Files Overview
Each commit has its own detailed PRD with:
- Implementation steps
- Acceptance criteria
- QA testing checklist
- Dependencies and definitions of done

Total estimated commits: **13**
Estimated development time: **2-3 weeks** for experienced React developer 