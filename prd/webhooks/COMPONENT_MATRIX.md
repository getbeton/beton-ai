# Webhook UI Component Matrix

**Visual reference for all COSS components used across webhook features**

---

## 🎨 Component Usage Matrix

| COSS Component | Incoming Webhook | Outbound Webhook | Total Usage | Notes |
|----------------|------------------|------------------|-------------|-------|
| **Dialog** | ✓ Main modal | ✓ Main modal | 2 | Primary modal container |
| **DialogContent** | ✓ | ✓ | 2 | max-w-2xl on both |
| **DialogHeader** | ✓ | ✓ | 2 | With icon + title |
| **DialogTitle** | ✓ | ✓ | 2 | Semibold, lg size |
| **DialogDescription** | ✓ | ✓ | 2 | Muted foreground |
| **DialogFooter** | ✓ | ✓ | 2 | Cancel + Primary action |
| **Tabs** | ✓ Setup/Test/Manage | ✓ Config/Deliveries/Settings | 2 | 3 tabs each |
| **TabsList** | ✓ | ✓ | 2 | Grid layout |
| **TabsTrigger** | ✓ (3x) | ✓ (3x) | 6 | One per tab |
| **TabsContent** | ✓ (3x) | ✓ (3x) | 6 | Content panels |
| **Button** | ✓ (8x) | ✓ (12x) | 20 | All variants used |
| **Input** | ✓ (4x) | ✓ (4x) | 8 | URL, name, test data |
| **Label** | ✓ (5x) | ✓ (5x) | 10 | Form labels |
| **Select** | ✓ (2x) | ✓ (2x) | 4 | Field/event selection |
| **SelectTrigger** | ✓ (2x) | ✓ (2x) | 4 | Dropdown triggers |
| **SelectContent** | ✓ (2x) | ✓ (2x) | 4 | Dropdown menus |
| **SelectItem** | ✓ (10x) | ✓ (10x) | 20+ | Dropdown options |
| **SelectValue** | ✓ (2x) | ✓ (2x) | 4 | Selected display |
| **Card** | ✓ (2x) | ✓ (2x) | 4 | Section containers |
| **CardContent** | ✓ (2x) | ✓ (2x) | 4 | Card bodies |
| **CardHeader** | ✓ (2x) | ✓ (1x) | 3 | Card headers |
| **CardTitle** | ✓ (2x) | ✓ (1x) | 3 | Card titles |
| **Badge** | ✓ (8x) | ✓ (7x) | 15 | Status indicators |
| **Separator** | ✓ (2x) | ✓ (2x) | 4 | Visual dividers |
| **Alert** | ✓ (3x) | ✓ (3x) | 6 | Messages |
| **AlertDescription** | ✓ (3x) | ✓ (3x) | 6 | Alert content |
| **Textarea** | ✓ (2x) | ✓ (2x) | 4 | JSON input/output |
| **Checkbox** | ✓ (1x) | ✓ (2x) | 3 | Boolean options |
| **DropdownMenu** | - | ✓ | 1 | Export menu |
| **DropdownMenuTrigger** | - | ✓ | 1 | Menu trigger |
| **DropdownMenuContent** | - | ✓ | 1 | Menu container |
| **DropdownMenuItem** | - | ✓ (3x) | 3 | Menu items |
| **DropdownMenuSeparator** | - | ✓ | 1 | Menu divider |
| **Table** | - | ✓ | 1 | Delivery log |
| **TableHeader** | - | ✓ | 1 | Log header |
| **TableBody** | - | ✓ | 1 | Log body |
| **TableRow** | - | ✓ (10x) | 10 | Log rows |
| **TableHead** | - | ✓ (4x) | 4 | Column headers |
| **TableCell** | - | ✓ (40x) | 40 | Log cells |

**Total Unique Components**: 36 COSS components  
**Total Component Instances**: 200+

---

## 📐 Layout Patterns

### Modal Size Classes
```tsx
// Standard modal
<DialogContent className="sm:max-w-2xl">

// Wide modal (if needed for delivery table)
<DialogContent className="sm:max-w-4xl">

// Narrow modal (for simple forms)
<DialogContent className="sm:max-w-md">

// Responsive height
<DialogContent className="max-h-[90vh] overflow-y-auto">
```

### Grid Layouts
```tsx
// Two-column form
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Test panel split view
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// Field mapping rows
<div className="grid grid-cols-[1fr,auto,1fr,auto] gap-2 items-center">
```

### Flex Layouts
```tsx
// Button groups
<div className="flex gap-2 justify-end">

// Status indicators
<div className="flex items-center gap-2">

// Headers with actions
<div className="flex items-center justify-between">
```

---

## 🎯 Component Hierarchy

### Incoming Webhook Modal Structure
```
Dialog
└── DialogContent
    ├── DialogHeader
    │   ├── DialogTitle
    │   └── DialogDescription
    ├── Tabs
    │   ├── TabsList
    │   │   ├── TabsTrigger ("Setup")
    │   │   ├── TabsTrigger ("Test")
    │   │   └── TabsTrigger ("Manage")
    │   ├── TabsContent ("Setup")
    │   │   ├── Input (Webhook URL)
    │   │   ├── Badge (Status)
    │   │   ├── Separator
    │   │   ├── Label ("Field Mapping")
    │   │   ├── [Field Mapping Rows]
    │   │   │   └── Select (Column selector) x N
    │   │   ├── Button ("Add Mapping")
    │   │   └── Checkbox (Options)
    │   ├── TabsContent ("Test")
    │   │   ├── Card (Test panel)
    │   │   │   ├── Textarea (JSON input)
    │   │   │   └── Textarea (Mapped output)
    │   │   ├── Button ("Send Test")
    │   │   └── Alert (Test result)
    │   └── TabsContent ("Manage")
    │       ├── Card (Statistics)
    │       ├── Badge (Active/Paused)
    │       └── Button ("Delete", destructive)
    └── DialogFooter
        ├── Button ("Cancel", outline)
        └── Button ("Save", default)
```

### Outbound Webhook Modal Structure
```
Dialog
└── DialogContent
    ├── DialogHeader
    │   ├── DialogTitle
    │   └── DialogDescription
    ├── Tabs
    │   ├── TabsList
    │   │   ├── TabsTrigger ("Configuration")
    │   │   ├── TabsTrigger ("Deliveries")
    │   │   └── TabsTrigger ("Settings")
    │   ├── TabsContent ("Configuration")
    │   │   ├── Label + Input (Name)
    │   │   ├── Label + Input (URL)
    │   │   ├── Label + Select (Events)
    │   │   ├── Checkbox (Options)
    │   │   ├── Separator
    │   │   └── Card (Payload preview)
    │   │       └── Textarea (JSON)
    │   ├── TabsContent ("Deliveries")
    │   │   └── Table
    │   │       ├── TableHeader
    │   │       │   └── TableRow
    │   │       │       ├── TableHead (Time)
    │   │       │       ├── TableHead (Event)
    │   │       │       ├── TableHead (Status)
    │   │       │       └── TableHead (Response)
    │   │       └── TableBody
    │   │           └── TableRow x N
    │   │               ├── TableCell (timestamp)
    │   │               ├── TableCell (event badge)
    │   │               ├── TableCell (status badge)
    │   │               └── TableCell (HTTP code)
    │   └── TabsContent ("Settings")
    │       ├── Card (Status toggle)
    │       ├── Card (Statistics)
    │       └── Card (Danger zone)
    │           └── Button ("Delete", destructive)
    └── DialogFooter
        ├── Button ("Cancel", outline)
        ├── Button ("Test", outline)
        └── Button ("Create/Update", default)
```

---

## 🔄 State Flow Diagrams

### Incoming Webhook Creation Flow
```
User clicks "Incoming Webhook" button
  ↓
Check if webhook exists for table
  ↓
├─ NO → Open modal to "Setup" tab
│        ↓
│        Generate webhook URL
│        ↓
│        User maps fields
│        ↓
│        User clicks "Test" (optional)
│        ↓
│        User clicks "Save"
│        ↓
│        Webhook created (Active)
│
└─ YES → Open modal to "Manage" tab
         ↓
         Show existing configuration
         ↓
         User can edit/test/toggle/delete
```

### Outbound Webhook Creation Flow
```
User clicks "Export" dropdown
  ↓
User clicks "Send to Webhook"
  ↓
Check if webhooks exist for table
  ↓
├─ NO → Open modal (new webhook form)
│        ↓
│        User enters URL
│        ↓
│        User selects events
│        ↓
│        User clicks "Test" (optional)
│        ↓
│        User clicks "Create"
│        ↓
│        Webhook created (Active)
│
└─ YES → Open modal to "Configuration" tab
         ↓
         Show list of webhooks
         ↓
         User can select webhook to edit
         ↓
         User can view deliveries
         ↓
         User can toggle/update/delete
```

---

## 📋 Implementation Checklist

### Pre-Implementation
- [x] PRD written for incoming webhooks
- [x] PRD written for outbound webhooks
- [x] Component inventory completed
- [x] File structure defined
- [x] API integration specified
- [ ] Design review completed
- [ ] Accessibility review completed

### Implementation Phase
- [ ] Create `/components/webhooks/` directory
- [ ] Implement shared types.ts
- [ ] Implement IncomingWebhookButton.tsx
- [ ] Implement IncomingWebhookModal.tsx
- [ ] Implement OutboundWebhookButton.tsx
- [ ] Implement OutboundWebhookModal.tsx
- [ ] Implement FieldMappingBuilder.tsx
- [ ] Implement WebhookTestPanel.tsx
- [ ] Implement WebhookDeliveryLog.tsx
- [ ] Update table detail page
- [ ] Update API client
- [ ] Write unit tests
- [ ] Write integration tests

### Testing Phase
- [ ] Manual testing - all flows
- [ ] Accessibility audit (aXe)
- [ ] Mobile responsive testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Error scenario testing
- [ ] Performance testing (bundle size)

### Documentation Phase
- [ ] Component JSDoc comments
- [ ] Update main README
- [ ] Create user guide with screenshots
- [ ] Record demo video (optional)
- [ ] Update CHANGELOG

### Deployment
- [ ] Code review
- [ ] QA approval
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitor for errors
- [ ] Gather user feedback

---

## 🎓 Development Tips

### 1. Start with Shared Components
Build `types.ts` and `FieldMappingBuilder.tsx` first since they're used by multiple features.

### 2. Reference Existing Patterns
- Look at `CsvUploadModal.tsx` for modal structure
- Look at `AdvancedTablesView.tsx` for dropdown menus
- Look at `IntegrationsPage.tsx` for tab patterns

### 3. Use Consistent Naming
```typescript
// Modal state
const [showIncomingWebhookModal, setShowIncomingWebhookModal] = useState(false);

// Loading state
const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);

// Data state
const [webhookConfig, setWebhookConfig] = useState<IncomingWebhook | null>(null);

// Error state
const [webhookError, setWebhookError] = useState<string | null>(null);
```

### 4. Handle Edge Cases Early
- Empty states (no columns, no webhooks)
- Loading states (fetching config)
- Error states (creation failed)
- Success states (webhook active)

### 5. Mobile-First Approach
Start with mobile layout, enhance for desktop:
```tsx
<div className="flex flex-col md:flex-row gap-4">
  {/* Stacks on mobile, side-by-side on desktop */}
</div>
```

---

## 📦 Bundle Size Estimate

| Component File | Estimated Size | Gzipped |
|----------------|----------------|---------|
| IncomingWebhookModal.tsx | ~15KB | ~4KB |
| OutboundWebhookModal.tsx | ~13KB | ~3.5KB |
| FieldMappingBuilder.tsx | ~8KB | ~2KB |
| WebhookTestPanel.tsx | ~6KB | ~1.5KB |
| WebhookDeliveryLog.tsx | ~5KB | ~1.2KB |
| types.ts | ~2KB | ~0.5KB |
| **Total** | **~49KB** | **~12.7KB** |

**Impact**: Minimal - well within acceptable limits for modern web apps

---

## 🎭 Animation Budget

### Animations to Include
1. Modal fade in/out (built-in Dialog)
2. Tab content transitions (built-in Tabs)
3. Badge pulse for active status
4. Loading spinner for test requests
5. Toast notifications (built-in)

### Animations to Avoid
- Complex page transitions
- Excessive micro-interactions
- Auto-play animations
- Heavy 3D transforms

**Performance Target**: 60 FPS on all interactions

---

## 🧩 Component Composition Examples

### Field Mapping Row
```tsx
<div className="grid grid-cols-[1fr,auto,1fr,auto] gap-2 items-center">
  {/* Source field */}
  <Input 
    value="email" 
    disabled 
    className="bg-muted"
  />
  
  {/* Arrow */}
  <span className="text-muted-foreground">→</span>
  
  {/* Target column */}
  <Select value={mapping.email} onValueChange={handleChange}>
    <SelectTrigger>
      <SelectValue placeholder="Select column..." />
    </SelectTrigger>
    <SelectContent>
      {columns.map(col => (
        <SelectItem key={col.id} value={col.id}>
          {col.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  
  {/* Remove button */}
  <Button 
    variant="ghost" 
    size="sm" 
    className="h-8 w-8 p-0"
    onClick={() => removeMapping('email')}
  >
    <X className="h-4 w-4" />
  </Button>
</div>
```

### Status Badge with Icon
```tsx
<Badge className={cn(
  'flex items-center gap-1',
  isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
)}>
  {isActive ? (
    <>
      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
      Active
    </>
  ) : (
    <>
      <div className="h-2 w-2 bg-gray-400 rounded-full" />
      Paused
    </>
  )}
</Badge>
```

### Delivery Status Row
```tsx
<TableRow>
  <TableCell className="font-mono text-xs text-muted-foreground">
    {formatTimeAgo(delivery.createdAt)}
  </TableCell>
  <TableCell>
    <Badge variant="outline">{delivery.event}</Badge>
  </TableCell>
  <TableCell>
    {delivery.status === 'success' ? (
      <Badge className="bg-green-100 text-green-800">
        <Check className="h-3 w-3 mr-1" />
        Success
      </Badge>
    ) : (
      <Badge variant="destructive">
        <X className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    )}
  </TableCell>
  <TableCell className="font-mono text-xs">
    HTTP {delivery.httpStatus}
  </TableCell>
</TableRow>
```

---

## 🎯 Quick Reference - Copy These Patterns

### Open Modal Pattern
```typescript
const [showModal, setShowModal] = useState(false);

<Button onClick={() => setShowModal(true)}>
  Open Webhook Config
</Button>

<WebhookModal
  open={showModal}
  onClose={() => setShowModal(false)}
  tableId={tableId}
/>
```

### Copy to Clipboard Pattern
```typescript
const handleCopyUrl = async () => {
  try {
    await navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied!');
  } catch {
    toast.error('Failed to copy URL');
  }
};

<Button variant="ghost" size="sm" onClick={handleCopyUrl}>
  <Copy className="h-4 w-4" />
</Button>
```

### Toggle Switch Pattern
```typescript
const [isActive, setIsActive] = useState(webhook.isActive);

const handleToggle = async () => {
  setIsActive(!isActive); // Optimistic update
  
  try {
    await apiClient.webhooks.update(webhook.id, { 
      isActive: !isActive 
    });
    toast.success(`Webhook ${!isActive ? 'activated' : 'paused'}`);
  } catch (error) {
    setIsActive(isActive); // Revert on error
    toast.error('Failed to update webhook');
  }
};

<div className="flex items-center justify-between">
  <Label>Webhook Status</Label>
  <Badge 
    className="cursor-pointer" 
    onClick={handleToggle}
  >
    {isActive ? 'Active' : 'Paused'}
  </Badge>
</div>
```

### Test Request Pattern
```typescript
const [testResult, setTestResult] = useState<TestResult | null>(null);
const [isTesting, setIsTesting] = useState(false);

const handleTest = async () => {
  setIsTesting(true);
  setTestResult(null);
  
  try {
    const result = await apiClient.webhooks.test(webhookId, testPayload);
    setTestResult(result);
    toast.success('Test successful!');
  } catch (error) {
    setTestResult({ 
      success: false, 
      error: error.message 
    });
    toast.error('Test failed');
  } finally {
    setIsTesting(false);
  }
};

<Button onClick={handleTest} disabled={isTesting}>
  {isTesting ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Testing...
    </>
  ) : (
    <>
      <Play className="h-4 w-4 mr-2" />
      Test Webhook
    </>
  )}
</Button>
```

---

## ⚡ Performance Optimizations

### 1. Lazy Load Modals
```typescript
import dynamic from 'next/dynamic';

const IncomingWebhookModal = dynamic(
  () => import('@/components/webhooks/IncomingWebhookModal'),
  { ssr: false }
);
```

### 2. Memoize Expensive Computations
```typescript
const mappedFields = useMemo(() => {
  return extractFieldsFromJSON(samplePayload);
}, [samplePayload]);
```

### 3. Debounce JSON Validation
```typescript
const debouncedValidation = useMemo(
  () => debounce((json: string) => validateJSON(json), 300),
  []
);
```

---

## 🎨 Figma Design System Alignment

**Color Tokens** (from globals.css):
- Primary: `#030213` (almost black)
- Secondary: `oklch(0.95 0.0058 264.53)` (light purple-gray)
- Muted: `#ececf0` (light gray)
- Destructive: `#d4183d` (red)
- Border: `rgba(0, 0, 0, 0.1)` (subtle)

**Usage in Webhooks**:
- Active webhooks: Use success green (not in tokens, use `bg-green-100 text-green-800`)
- Paused webhooks: Use muted colors
- Failed states: Use destructive colors
- Borders: Use standard border color

---

## 📱 Accessibility Checklist

- [ ] All buttons have aria-labels
- [ ] Form inputs have associated labels
- [ ] Modal has aria-describedby
- [ ] Tab panels have aria-labelledby
- [ ] Status changes announced (use toast or aria-live)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus trapped in modal
- [ ] Color contrast ratio > 4.5:1
- [ ] Error messages associated with inputs
- [ ] Loading states have aria-busy

---

This matrix ensures 100% consistency across both webhook features while maximizing component reuse.


