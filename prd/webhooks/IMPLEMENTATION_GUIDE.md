# Webhook UI Implementation Guide

**Last Updated**: October 16, 2025  
**Status**: Ready for Implementation

---

## 📦 COSS Component Inventory

This guide lists ALL COSS components used across both webhook features for consistent implementation.

### Core Components (Used in Both Features)

| Component | Import Path | Usage Count | Purpose |
|-----------|-------------|-------------|---------|
| `Dialog` | `@/components/ui/dialog` | 2 modals | Main modal container |
| `DialogContent` | `@/components/ui/dialog` | 2 | Modal content wrapper |
| `DialogHeader` | `@/components/ui/dialog` | 2 | Modal header section |
| `DialogTitle` | `@/components/ui/dialog` | 2 | Modal title |
| `DialogDescription` | `@/components/ui/dialog` | 2 | Modal description |
| `DialogFooter` | `@/components/ui/dialog` | 2 | Modal action buttons area |
| `Button` | `@/components/ui/button` | 20+ | All interactive actions |
| `Input` | `@/components/ui/input` | 8 | Text inputs, URL fields |
| `Label` | `@/components/ui/label` | 10 | Form labels |
| `Card` | `@/components/ui/card` | 4 | Section containers |
| `CardContent` | `@/components/ui/card` | 4 | Card body |
| `CardHeader` | `@/components/ui/card` | 3 | Card headers |
| `CardTitle` | `@/components/ui/card` | 3 | Card titles |
| `Badge` | `@/components/ui/badge` | 15+ | Status indicators |
| `Separator` | `@/components/ui/separator` | 4 | Visual dividers |
| `Alert` | `@/components/ui/alert` | 6 | Info/warning messages |
| `AlertDescription` | `@/components/ui/alert` | 6 | Alert content |

### Tab Components (Used in Both Features)

| Component | Import Path | Usage | Purpose |
|-----------|-------------|-------|---------|
| `Tabs` | `@/components/ui/tabs` | 2 | Tab container |
| `TabsList` | `@/components/ui/tabs` | 2 | Tab navigation |
| `TabsTrigger` | `@/components/ui/tabs` | 6 | Individual tab buttons |
| `TabsContent` | `@/components/ui/tabs` | 6 | Tab content panels |

### Form Components

| Component | Import Path | Usage | Purpose |
|-----------|-------------|-------|---------|
| `Select` | `@/components/ui/select` | 4 | Dropdown selectors |
| `SelectTrigger` | `@/components/ui/select` | 4 | Dropdown trigger |
| `SelectContent` | `@/components/ui/select` | 4 | Dropdown menu |
| `SelectItem` | `@/components/ui/select` | 20+ | Dropdown options |
| `SelectValue` | `@/components/ui/select` | 4 | Selected value display |
| `Textarea` | `@/components/ui/textarea` | 4 | Multi-line text input |
| `Checkbox` | `@/components/ui/checkbox` | 3 | Boolean options |

### Dropdown Menu (Outbound Webhook Only)

| Component | Import Path | Usage | Purpose |
|-----------|-------------|-------|---------|
| `DropdownMenu` | `@/components/ui/dropdown-menu` | 1 | Export menu container |
| `DropdownMenuTrigger` | `@/components/ui/dropdown-menu` | 1 | Menu trigger |
| `DropdownMenuContent` | `@/components/ui/dropdown-menu` | 1 | Menu items container |
| `DropdownMenuItem` | `@/components/ui/dropdown-menu` | 3 | Menu items |
| `DropdownMenuSeparator` | `@/components/ui/dropdown-menu` | 1 | Menu divider |

### Data Display (Deliveries Tab)

| Component | Import Path | Usage | Purpose |
|-----------|-------------|-------|---------|
| `Table` | `@/components/ui/table` | 1 | Delivery history |
| `TableHeader` | `@/components/ui/table` | 1 | Table header |
| `TableBody` | `@/components/ui/table` | 1 | Table body |
| `TableRow` | `@/components/ui/table` | 10+ | Table rows |
| `TableHead` | `@/components/ui/table` | 4 | Column headers |
| `TableCell` | `@/components/ui/table` | 40+ | Table cells |

### Icons (from lucide-react)

| Icon | Usage | Purpose |
|------|-------|---------|
| `Webhook` | 2 | Webhook indicators |
| `Send` | 3 | Send/outbound actions |
| `Download` | 2 | Export actions |
| `Copy` | 4 | Copy to clipboard |
| `Check` | 5 | Success states |
| `X` | 5 | Close/remove actions |
| `AlertCircle` | 4 | Warnings/errors |
| `Settings` | 2 | Configuration |
| `Play` | 1 | Test webhook |
| `Pause` | 1 | Pause webhook |
| `Trash2` | 2 | Delete actions |
| `ExternalLink` | 2 | Open in new tab |
| `ChevronDown` | 2 | Dropdown indicators |
| `Loader2` | 3 | Loading states |

---

## 🎨 Design System Consistency

### Button Variants Usage

```tsx
// Primary actions (create, save, test)
<Button variant="default">Create Webhook</Button>

// Secondary actions (cancel, close)
<Button variant="outline">Cancel</Button>

// Destructive actions (delete)
<Button variant="destructive">Delete Webhook</Button>

// Utility actions (copy URL)
<Button variant="ghost" size="sm">
  <Copy className="h-4 w-4" />
</Button>
```

### Badge Variants Usage

```tsx
// Active/Success status
<Badge variant="default" className="bg-green-100 text-green-800">
  Active
</Badge>

// Inactive/Paused status
<Badge variant="secondary">Paused</Badge>

// Warning status
<Badge variant="outline" className="border-yellow-500 text-yellow-700">
  Testing
</Badge>

// Error status
<Badge variant="destructive">Failed</Badge>
```

### Alert Variants Usage

```tsx
// Info/Instructions
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>Webhook URL will be generated...</AlertDescription>
</Alert>

// Error/Warning
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>Invalid URL format</AlertDescription>
</Alert>

// Success (custom)
<Alert className="border-green-200 bg-green-50">
  <CheckCircle className="h-4 w-4 text-green-600" />
  <AlertDescription className="text-green-800">
    Webhook test successful!
  </AlertDescription>
</Alert>
```

---

## 📁 File Structure

```
frontend/src/components/webhooks/
├── IncomingWebhookButton.tsx      # Trigger button (incoming)
├── IncomingWebhookModal.tsx       # Main modal (incoming)
├── OutboundWebhookButton.tsx      # Dropdown trigger (outbound)
├── OutboundWebhookModal.tsx       # Main modal (outbound)
├── FieldMappingBuilder.tsx        # Shared: field mapping UI
├── WebhookTestPanel.tsx           # Shared: test interface
├── WebhookDeliveryLog.tsx         # Shared: delivery history
└── types.ts                       # Shared: TypeScript types
```

---

## 🔄 State Management Pattern

### Webhook State Interface
```typescript
interface WebhookState {
  // Incoming
  incomingWebhook: IncomingWebhook | null;
  incomingLoading: boolean;
  incomingError: string | null;
  
  // Outbound
  outboundWebhooks: OutboundWebhook[];
  outboundLoading: boolean;
  outboundError: string | null;
  
  // UI state
  showIncomingModal: boolean;
  showOutboundModal: boolean;
  selectedTab: 'setup' | 'test' | 'manage';
}
```

### Modal Control Pattern
```typescript
const [showModal, setShowModal] = useState(false);
const [selectedTab, setSelectedTab] = useState('setup');

// Open modal
const handleOpenModal = () => {
  setSelectedTab(webhookExists ? 'manage' : 'setup');
  setShowModal(true);
};

// Close modal
const handleCloseModal = () => {
  setShowModal(false);
  // Reset form if needed
};
```

---

## 🧪 Testing Strategy

### Unit Tests (Jest + React Testing Library)

**Files to Test**:
1. `IncomingWebhookModal.test.tsx`
2. `OutboundWebhookModal.test.tsx`
3. `FieldMappingBuilder.test.tsx`

**Test Cases**:
```typescript
describe('IncomingWebhookModal', () => {
  it('renders setup tab for new webhook');
  it('renders manage tab for existing webhook');
  it('generates webhook URL on mount');
  it('validates field mappings before save');
  it('shows test results after sending test data');
  it('toggles webhook active state');
  it('confirms before deleting webhook');
});

describe('OutboundWebhookModal', () => {
  it('validates URL format');
  it('requires at least one event selected');
  it('shows payload preview');
  it('sends test request and displays response');
  it('creates webhook with correct payload');
  it('updates existing webhook');
  it('shows delivery history');
});
```

### Integration Tests

**Test Scenarios**:
1. Create incoming webhook → Send test data → Verify row created
2. Create outbound webhook → Create row → Verify webhook fired
3. Pause webhook → Create row → Verify webhook didn't fire
4. Resume webhook → Create row → Verify webhook fired
5. Delete webhook → Verify URL returns 404

---

## 📊 Component Reusability

### Shared Components

#### 1. `FieldMappingBuilder.tsx`
**Used in**: Incoming webhook setup
**Props**:
```typescript
interface FieldMappingBuilderProps {
  availableFields: string[];      // From sample JSON
  tableColumns: TableColumn[];    // From table
  mapping: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
}
```

#### 2. `WebhookTestPanel.tsx`
**Used in**: Both incoming and outbound test tabs
**Props**:
```typescript
interface WebhookTestPanelProps {
  type: 'incoming' | 'outbound';
  onTest: (payload?: any) => Promise<TestResult>;
  showPayloadInput?: boolean;  // Only for incoming
}
```

#### 3. `WebhookDeliveryLog.tsx`
**Used in**: Outbound webhook deliveries tab
**Props**:
```typescript
interface WebhookDeliveryLogProps {
  webhookId: string;
  deliveries: WebhookDelivery[];
  loading: boolean;
}
```

---

## 🎯 Implementation Order

### Phase 1: Incoming Webhooks (Days 1-2)
1. Create `IncomingWebhookButton.tsx` (2 hours)
2. Create `IncomingWebhookModal.tsx` skeleton with tabs (3 hours)
3. Implement Setup tab with field mapping (4 hours)
4. Implement Test tab with JSON input/output (3 hours)
5. Implement Manage tab with stats and toggle (2 hours)
6. Integration with table detail page (1 hour)
7. Testing and bug fixes (2 hours)

### Phase 2: Outbound Webhooks (Days 3-4)
1. Create `OutboundWebhookButton.tsx` with dropdown (2 hours)
2. Create `OutboundWebhookModal.tsx` skeleton with tabs (2 hours)
3. Implement Configuration tab (3 hours)
4. Implement Deliveries tab (3 hours)
5. Implement Settings tab (2 hours)
6. Implement test functionality (2 hours)
7. Integration with table detail page (1 hour)
8. Testing and bug fixes (2 hours)

### Phase 3: Polish & Documentation (Day 5)
1. Refactor shared components (2 hours)
2. Add comprehensive error handling (2 hours)
3. Write component documentation (2 hours)
4. Update README with webhook screenshots (2 hours)

**Total**: 5 days (40 hours)

---

## 🚀 Quick Start for Developers

### 1. Install Dependencies (if needed)
```bash
cd frontend
# All dependencies already in package.json
npm install
```

### 2. Create Component Files
```bash
mkdir -p src/components/webhooks
touch src/components/webhooks/IncomingWebhookButton.tsx
touch src/components/webhooks/IncomingWebhookModal.tsx
touch src/components/webhooks/OutboundWebhookButton.tsx
touch src/components/webhooks/OutboundWebhookModal.tsx
touch src/components/webhooks/FieldMappingBuilder.tsx
touch src/components/webhooks/WebhookTestPanel.tsx
touch src/components/webhooks/types.ts
```

### 3. Add API Client Methods
Edit `src/lib/api.ts` and add webhook methods (see PRDs)

### 4. Integrate with Table Detail Page
Edit `src/app/dashboard/tables/[id]/page.tsx`:
- Import webhook buttons
- Add to toolbar
- Add state management

### 5. Test Locally
```bash
npm run dev
# Navigate to http://localhost:3000/dashboard/tables/:id
# Test webhook configuration
```

---

## 📝 Code Style Guidelines

### Component Header Format
```typescript
/**
 * IncomingWebhookModal
 * 
 * Modal for configuring incoming webhooks with field mapping,
 * testing, and management capabilities.
 * 
 * Features:
 * - 3-tab interface (Setup, Test, Manage)
 * - Field mapping with dropdowns
 * - Live test with JSON preview
 * - Toggle webhook on/off
 * 
 * @example
 * <IncomingWebhookModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   tableId="clx123..."
 *   tableColumns={columns}
 * />
 */
```

### State Management Pattern
```typescript
// Use useState for local UI state
const [activeTab, setActiveTab] = useState('setup');
const [mapping, setMapping] = useState<Record<string, string>>({});

// Use useEffect for data fetching
useEffect(() => {
  if (open && tableId) {
    fetchWebhookConfig();
  }
}, [open, tableId]);

// Use useCallback for event handlers
const handleSave = useCallback(async () => {
  // ...
}, [dependencies]);
```

### Error Handling Pattern
```typescript
try {
  const response = await apiClient.webhooks.create(data);
  if (response.data.success) {
    toast.success('Webhook created!');
    onClose();
  }
} catch (error: any) {
  console.error('[IncomingWebhookModal] Create failed:', error);
  toast.error(error.response?.data?.error || 'Failed to create webhook');
}
```

---

## 🎨 Visual Design Tokens

### Spacing
```tsx
// Modal content padding
<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">

// Section spacing
<div className="space-y-4">

// Form field spacing  
<div className="space-y-2">

// Button group spacing
<div className="flex gap-2">
```

### Colors (Webhook Status)
```tsx
const statusColors = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-800',
  testing: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
};
```

### Typography
```tsx
// Modal title
<DialogTitle className="text-lg font-semibold">

// Section heading
<h3 className="text-sm font-medium">

// Helper text
<p className="text-xs text-muted-foreground">

// Code/URLs
<code className="px-2 py-1 bg-muted rounded text-sm font-mono">
```

---

## 🔗 Integration Points

### Table Detail Page Modifications

**File**: `frontend/src/app/dashboard/tables/[id]/page.tsx`

**Current Actions Area** (line ~1087):
```tsx
actions={
  <Button variant="outline" onClick={handleExportCSV}>
    <Download className="h-4 w-4 mr-2" />
    Export CSV
  </Button>
}
```

**New Actions Area**:
```tsx
actions={
  <div className="flex gap-2">
    {/* Incoming Webhook */}
    <IncomingWebhookButton
      tableId={tableId}
      tableName={table.name}
      columns={table.columns || []}
    />
    
    {/* Outbound Webhook (replaces Export CSV) */}
    <OutboundWebhookButton
      tableId={tableId}
      tableName={table.name}
      onExportCSV={handleExportCSV}
    />
  </div>
}
```

### API Client Extensions

**File**: `frontend/src/lib/api.ts`

**Add after line 481** (after aiTasks):
```typescript
  // Webhook endpoints
  webhooks: {
    // Incoming
    createIncoming: (data: CreateIncomingWebhookRequest) =>
      api.post('/api/webhooks', data),
    
    listIncoming: () =>
      api.get('/api/webhooks'),
    
    getIncoming: (tableId: string) =>
      api.get(`/api/webhooks/table/${tableId}`),
    
    deleteIncoming: (webhookId: string) =>
      api.delete(`/api/webhooks/${webhookId}`),
    
    updateIncoming: (webhookId: string, data: UpdateIncomingWebhookRequest) =>
      api.put(`/api/webhooks/${webhookId}`, data),
    
    // Outbound
    createOutbound: (data: CreateOutboundWebhookRequest) =>
      api.post('/api/webhooks/outbound', data),
    
    listOutbound: (tableId?: string) =>
      api.get(`/api/webhooks/outbound${tableId ? `?tableId=${tableId}` : ''}`),
    
    updateOutbound: (webhookId: string, data: UpdateOutboundWebhookRequest) =>
      api.put(`/api/webhooks/outbound/${webhookId}`, data),
    
    deleteOutbound: (webhookId: string) =>
      api.delete(`/api/webhooks/outbound/${webhookId}`),
    
    testOutbound: (webhookId: string) =>
      api.post(`/api/webhooks/outbound/${webhookId}/test`),
  },
```

---

## 📱 Responsive Design

### Desktop (> 768px)
- Full-width modals (max-w-2xl)
- Side-by-side test panels
- Table view for deliveries
- All tabs visible

### Mobile (< 768px)
- Narrower modals (max-w-lg)
- Stacked test panels
- Card view for deliveries (not table)
- Tabs scrollable if needed

**Responsive Classes**:
```tsx
<DialogContent className="sm:max-w-2xl max-w-[95vw]">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Stacks on mobile, side-by-side on desktop */}
  </div>
</DialogContent>
```

---

## 🔐 Security Considerations (UI)

### URL Validation
```typescript
const validateWebhookUrl = (url: string): { valid: boolean; error?: string } => {
  // Check format
  try {
    const parsed = new URL(url);
    
    // Must be HTTP(S)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    // Warn on HTTP (not HTTPS)
    if (parsed.protocol === 'http:') {
      toast.warning('HTTP is not secure. Consider using HTTPS.');
    }
    
    // Block localhost in production
    if (process.env.NODE_ENV === 'production' && 
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
      return { valid: false, error: 'Localhost URLs not allowed in production' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};
```

### JSON Validation (Incoming Webhook Test)
```typescript
const validateJSON = (jsonString: string): { valid: boolean; parsed?: any; error?: string } => {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null) {
      return { valid: false, error: 'JSON must be an object' };
    }
    return { valid: true, parsed };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
};
```

---

## 🎭 Animation & Transitions

### Modal Animations
```tsx
// Use default Dialog animations (fade + zoom)
<Dialog open={open} onOpenChange={setOpen}>
  {/* Built-in animations from COSS */}
</Dialog>
```

### Status Badge Pulse
```tsx
<Badge className={cn(
  'bg-green-100 text-green-800',
  isActive && 'animate-pulse'
)}>
  Active
</Badge>
```

### Loading States
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Creating...
    </>
  ) : (
    'Create Webhook'
  )}
</Button>
```

---

## 📚 Component Reference Examples

### From Existing Codebase

**Modal Pattern** - See `CsvUploadModal.tsx`:
```tsx
<Dialog open={open} onOpenChange={handleClose}>
  <DialogContent className="sm:max-w-xl">
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Tab Pattern** - See `dashboard/integrations/page.tsx`:
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="setup">Setup</TabsTrigger>
    <TabsTrigger value="test">Test</TabsTrigger>
  </TabsList>
  <TabsContent value="setup">...</TabsContent>
  <TabsContent value="test">...</TabsContent>
</Tabs>
```

**Dropdown Menu** - See `AdvancedTablesView.tsx`:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleAction}>
      <Icon className="mr-2 h-4 w-4" />
      Action Name
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## ✅ Definition of Done

### Incoming Webhooks
- [ ] User can generate webhook URL from table page
- [ ] User can configure field mappings visually
- [ ] User can test webhook with sample JSON
- [ ] User can see mapped result before saving
- [ ] User can toggle webhook active/inactive
- [ ] User can view webhook statistics
- [ ] User can delete webhook with confirmation
- [ ] All COSS components properly styled
- [ ] Responsive on mobile and desktop
- [ ] Keyboard accessible
- [ ] Error states handled gracefully

### Outbound Webhooks
- [ ] User can access webhook config from Export dropdown
- [ ] User can create webhook with URL and events
- [ ] User can test webhook and see response
- [ ] User can view delivery history
- [ ] User can pause/resume webhook
- [ ] User can delete webhook with confirmation
- [ ] Payload preview shown before creation
- [ ] URL validation prevents invalid URLs
- [ ] All COSS components properly styled
- [ ] Responsive on mobile and desktop
- [ ] Keyboard accessible
- [ ] Error states handled gracefully

---

## 📖 Documentation Requirements

### Component Documentation
Each component file should have:
```typescript
/**
 * ComponentName
 * 
 * Brief description of what it does.
 * 
 * @example
 * <ComponentName
 *   prop1="value"
 *   prop2={callback}
 * />
 */
```

### README Updates
Add to main README.md:
```markdown
## 🔗 Webhooks

### Incoming Webhooks
Receive data from external services automatically:
- Generate unique URLs for each table
- Map external fields to table columns
- Test with sample data before going live

### Outbound Webhooks
Send data to external services on events:
- Notify CRMs when rows are created
- Trigger workflows on data changes
- Integrate with Zapier, Make, and custom APIs

See [Webhook Documentation](./prd/webhooks/) for details.
```

---

## 🎯 Success Criteria

### UX Metrics
- Time to first webhook configuration: < 3 minutes
- Webhook test success rate: > 90%
- Configuration completion rate: > 85%
- User satisfaction score: > 4/5

### Technical Metrics
- Component bundle size: < 50KB (gzipped)
- Modal render time: < 100ms
- No accessibility violations (aXe)
- Code coverage: > 80%

---

## 🐛 Known Limitations (MVP)

1. **No custom transformations**: Field mapping is 1:1 only
2. **No webhook secrets**: HMAC signatures not in MVP
3. **No retry configuration**: Uses backend defaults
4. **Limited delivery history**: Last 20 deliveries only
5. **No custom headers**: Outbound webhooks send default headers only
6. **No filtering**: Webhooks fire for all rows, no conditions

These will be added in v2 based on user feedback.


