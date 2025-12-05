# PRD: Outbound Webhooks UI

**Feature**: Allow users to send data to external URLs when table events occur (row created, row enriched)

**Priority**: High  
**Effort**: 2-3 days  
**Dependencies**: Backend outbound webhook endpoints (commits 11-15)

---

## Overview

Enable users to configure outbound webhooks that send HTTP POST requests to external URLs when specific table events occur. Primary use cases: notify CRM systems, trigger workflows, sync data to external systems.

---

## User Stories

1. **As a user**, I want to send data to my CRM when a new row is created
2. **As a user**, I want to choose which events trigger the webhook (row created vs enriched)
3. **As a user**, I want to pause/resume webhooks without deleting them
4. **As a user**, I want to see webhook delivery status and history
5. **As a user**, I want to test webhooks before enabling them

---

## UI Components Breakdown

### Component 1: Export/Webhook Button (Table Detail Page)

**Location**: `/dashboard/tables/[id]/page.tsx` - Extend existing "Export CSV" button

**COSS Components Used**:
- `DropdownMenu` + `DropdownMenuTrigger` + `DropdownMenuContent` + `DropdownMenuItem` + `DropdownMenuSeparator`
- `Button`
- `Dialog`

**Visual Structure**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Export
      <ChevronDown className="h-4 w-4 ml-2" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleExportCSV}>
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      Download as CSV
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleOpenOutboundWebhook}>
      <Send className="h-4 w-4 mr-2" />
      Send to Webhook
      {hasActiveWebhook && <Badge className="ml-2">Active</Badge>}
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Component 2: Outbound Webhook Configuration Modal

**COSS Components Used**:
- `Dialog` + `DialogContent` + `DialogHeader` + `DialogTitle` + `DialogDescription` + `DialogFooter`
- `Card` + `CardContent` + `CardHeader` + `CardTitle` + `CardDescription`
- `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` (if webhook exists)
- `Input` - Webhook URL, name
- `Button` - Actions
- `Label` - Form labels
- `Select` + `SelectTrigger` + `SelectContent` + `SelectItem` + `SelectValue` - Event selection
- `Badge` - Status indicators
- `Separator` - Section dividers
- `Alert` + `AlertDescription` - Warnings and info
- `Checkbox` - Options

**Modal Layout - New Webhook**:

```
┌──────────────────────────────────────────────┐
│ Send Data to Webhook                         │
│ Configure outbound webhook for table         │
├──────────────────────────────────────────────┤
│                                              │
│ Webhook Name                                 │
│ ┌────────────────────────────────────────┐  │
│ │ Notify CRM on new leads                │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ Webhook URL *                                │
│ ┌────────────────────────────────────────┐  │
│ │ https://hooks.zapier.com/hooks/...     │  │
│ └────────────────────────────────────────┘  │
│ ⓘ URL must start with https://              │
│                                              │
│ Trigger Events *                             │
│ ┌────────────────────────────────────────┐  │
│ │ When row is created                ▼  │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ Options:                                     │
│ [ ] Include all table columns                │
│ [✓] Send only filled fields                  │
│                                              │
│ ──────────────────────────────────────      │
│                                              │
│ Preview Payload                              │
│ ┌────────────────────────────────────────┐  │
│ │ {                                      │  │
│ │   "event": "row.created",              │  │
│ │   "table_id": "...",                   │  │
│ │   "data": { ... }                      │  │
│ │ }                                      │  │
│ └────────────────────────────────────────┘  │
│                                              │
│            [Cancel] [Test] [Create Webhook] │
└──────────────────────────────────────────────┘
```

**Modal Layout - Existing Webhook** (with Tabs):

```
┌──────────────────────────────────────────────┐
│ Manage Outbound Webhook                      │
├──────────────────────────────────────────────┤
│ [Configuration] [Deliveries] [Settings]     │
│                                              │
│ ─── Configuration Tab ───                   │
│                                              │
│ Webhook Name                                 │
│ ┌────────────────────────────────────────┐  │
│ │ Notify CRM on new leads                │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ Target URL                                   │
│ ┌────────────────────────────────────────┐  │
│ │ https://hooks.zapier.com/...           │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ Trigger Events                               │
│ ┌────────────────────────────────────────┐  │
│ │ When row is created                ▼  │  │
│ └────────────────────────────────────────┘  │
│                                              │
│               [Cancel] [Update Webhook]      │
│                                              │
│ ─── Deliveries Tab ───                      │
│                                              │
│ Recent Deliveries                            │
│ ┌────────────────────────────────────────┐  │
│ │ ✓ 2 min ago  row.created  HTTP 200    │  │
│ │ ✓ 5 min ago  row.created  HTTP 200    │  │
│ │ ✗ 10 min ago row.created  HTTP 500    │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ ─── Settings Tab ───                        │
│                                              │
│ Webhook Status                               │
│ Active [Toggle Switch]                       │
│                                              │
│ Statistics                                   │
│ Total Sent:     1,234                        │
│ Success Rate:   98.5%                        │
│ Last Sent:      2 minutes ago                │
│                                              │
│ Danger Zone                                  │
│ [Delete Webhook]                             │
│                                              │
│                             [Close]          │
└──────────────────────────────────────────────┘
```

---

### Component 3: Webhook Test Dialog

**COSS Components Used**:
- `Dialog` + `DialogContent` + `DialogHeader`
- `Card` + `CardContent`
- `Button`
- `Badge`
- `Alert`
- `Textarea` (for response preview)

**Test Dialog Layout**:
```
┌─────────────────────────────────────┐
│ Test Webhook                        │
├─────────────────────────────────────┤
│                                     │
│ Testing webhook to:                 │
│ https://hooks.zapier.com/...        │
│                                     │
│ [Sending test request...]           │
│                                     │
│ Response:                           │
│ ┌─────────────────────────────────┐ │
│ │ Status: 200 OK                  │ │
│ │ Response Time: 234ms            │ │
│ │                                 │ │
│ │ Body:                           │ │
│ │ { "success": true }             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ✓ Webhook is working correctly!    │
│                                     │
│                    [Close]          │
└─────────────────────────────────────┘
```

---

## Component Files to Create

### 1. `/frontend/src/components/webhooks/OutboundWebhookButton.tsx`
**Purpose**: Dropdown trigger in table toolbar
**Exports**: `OutboundWebhookButton`

### 2. `/frontend/src/components/webhooks/OutboundWebhookModal.tsx`
**Purpose**: Main configuration modal
**Exports**: `OutboundWebhookModal`
**Components Used**:
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- Tabs, TabsList, TabsTrigger, TabsContent
- Card, CardContent, CardHeader, CardTitle
- Button (multiple variants)
- Input
- Select, SelectTrigger, SelectContent, SelectItem, SelectValue
- Badge
- Separator
- Alert, AlertDescription
- Checkbox
- Label
- Textarea (for JSON preview)

### 3. `/frontend/src/components/webhooks/WebhookDeliveryLog.tsx`
**Purpose**: Show webhook delivery history
**Exports**: `WebhookDeliveryLog`
**Components Used**:
- Table, TableHeader, TableBody, TableRow, TableCell, TableHead
- Badge
- Button
- Tooltip (optional, for response details)

---

## API Integration

### Frontend API Client (`frontend/src/lib/api.ts`)

Add to `apiClient.webhooks`:
```typescript
webhooks: {
  // ... incoming webhooks (from previous PRD)
  
  // Outbound webhooks
  createOutbound: (data: {
    tableId: string;
    name: string;
    url: string;
    events: string[];
  }) => api.post('/api/webhooks/outbound', data),
  
  listOutbound: () => 
    api.get('/api/webhooks/outbound'),
  
  updateOutbound: (webhookId: string, data: any) =>
    api.put(`/api/webhooks/outbound/${webhookId}`, data),
  
  deleteOutbound: (webhookId: string) =>
    api.delete(`/api/webhooks/outbound/${webhookId}`),
  
  testOutbound: (webhookId: string) =>
    api.post(`/api/webhooks/outbound/${webhookId}/test`),
}
```

---

## User Flow

### Create Outbound Webhook
1. User clicks "Export" dropdown → "Send to Webhook"
2. Modal opens (empty state for new webhook)
3. User enters webhook name
4. User enters target URL
5. User selects trigger event (row.created or row.enriched)
6. User sees payload preview
7. User clicks "Test" to verify endpoint works
8. User clicks "Create Webhook"
9. Webhook is now active

### Manage Existing Webhook
1. User clicks "Export" dropdown → "Send to Webhook"
2. Modal opens to "Configuration" tab
3. User can edit URL, name, events
4. User switches to "Deliveries" tab to see history
5. User switches to "Settings" tab to pause/delete
6. User makes changes and clicks "Update Webhook"

### Test Webhook
1. From any tab, user clicks "Test Webhook" button
2. System sends test request to configured URL
3. Test dialog shows response (status, time, body)
4. User confirms webhook is working
5. User closes test dialog

---

## Event Options

**Trigger Events** (Select dropdown):
- `row.created` - Fired immediately when row is created
- `row.updated` - Fired when any cell in row is updated
- `row.enriched` - Fired when all AI/enrichment tasks complete for row
- `cell.updated` - Fired when specific cell changes (advanced)

**Initial Implementation**: Support only `row.created` and `row.updated`

---

## Payload Format

**Sent to external URL**:
```json
{
  "event": "row.created",
  "table": {
    "id": "clx123...",
    "name": "Leads"
  },
  "data": {
    "row_id": "clx456...",
    "created_at": "2025-10-16T14:00:00Z",
    "values": {
      "email": "test@example.com",
      "name": "John Doe",
      "company": "Acme Inc"
    }
  },
  "timestamp": "2025-10-16T14:00:00Z"
}
```

---

## Edge Cases & Error Handling

1. **Invalid URL format**: Show validation error "Please enter a valid HTTPS URL"
2. **Non-HTTPS URL**: Show warning "We recommend using HTTPS for security"
3. **Webhook test fails**: Show error details, allow retry
4. **No events selected**: Disable save button
5. **Webhook delivery fails** (background): Log but don't notify user immediately
6. **Multiple webhooks**: Allow multiple webhooks per table with different URLs

---

## Accessibility

- Dropdown menu keyboard navigable
- Modal keyboard accessible
- Clear focus indicators
- ARIA labels on all controls
- Error messages announced to screen readers

---

## Success Metrics

- Webhook creation time < 1 minute
- Test success rate > 95%
- Webhook delivery success rate > 98%

---

## Implementation Notes

1. Reuse `DropdownMenu` pattern from `AdvancedTablesView.tsx` row actions
2. Modal structure similar to `IncomingWebhookModal.tsx` for consistency
3. Use `Badge` component to show webhook status (Active/Paused)
4. Toast notifications for all actions
5. Optimistic UI updates for toggle switch
6. Background delivery tracking (don't block UI)

---

## Component Integration Points

### Table Detail Page (`/dashboard/tables/[id]/page.tsx`)

**Current**:
```tsx
<Button variant="outline" onClick={handleExportCSV}>
  <Download className="h-4 w-4 mr-2" />
  Export CSV
</Button>
```

**New** (replace with dropdown):
```tsx
<OutboundWebhookButton 
  tableId={tableId}
  tableName={table.name}
  onExportCSV={handleExportCSV}
/>
```

---

## Validation Rules

### URL Validation
- Must be valid URL format
- Must start with `http://` or `https://`
- Warn if using `http://` (not https)
- No localhost or internal IPs in production

### Event Validation
- At least one event must be selected
- Valid events: `row.created`, `row.updated`, `row.enriched`, `cell.updated`

### Name Validation
- Required field
- 1-100 characters
- No special characters except spaces, hyphens, underscores

---

## Visual Design Patterns

### Status Indicators
- **Active**: Green badge with pulse animation
- **Paused**: Gray badge
- **Failed**: Red badge with error count

### Delivery Status Icons
- ✓ Success (green)
- ✗ Failed (red)
- ⏱ Pending (yellow)
- ⏸ Paused (gray)

### Button Variants
- Primary action: `variant="default"` (Create, Update, Test)
- Secondary action: `variant="outline"` (Cancel, Close)
- Destructive: `variant="destructive"` (Delete)
- Menu trigger: `variant="ghost"` (Dropdown menu items)

---

## Error States

### Webhook Creation Failed
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>
    Failed to create webhook. Please check the URL and try again.
  </AlertDescription>
</Alert>
```

### Test Failed
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>
    Webhook test failed: HTTP 500 - Internal Server Error
  </AlertDescription>
</Alert>
```

### URL Validation Error
```tsx
<Input 
  aria-invalid={!isValidUrl}
  className={!isValidUrl ? 'border-destructive' : ''}
/>
{!isValidUrl && (
  <p className="text-sm text-destructive mt-1">
    Please enter a valid HTTPS URL
  </p>
)}
```

---

## Success States

### Webhook Created
```tsx
toast.success('Webhook created successfully!', { duration: 3000 });
```

### Test Successful
```tsx
<Alert className="border-green-200 bg-green-50">
  <CheckCircle className="h-4 w-4 text-green-600" />
  <AlertDescription className="text-green-800">
    Test successful! Your webhook endpoint responded with HTTP 200.
  </AlertDescription>
</Alert>
```

---

## Desktop vs Mobile Considerations

### Desktop (> 768px)
- Full modal width (max-w-2xl)
- Side-by-side test view
- Full delivery log table

### Mobile (< 768px)
- Stacked layout
- Simplified delivery log (cards instead of table)
- Bottom sheet style for modals (optional enhancement)

---

## Future Enhancements (Not in MVP)

1. Custom payload templates (Handlebars)
2. Retry configuration (max retries, delay)
3. Custom headers
4. HMAC signature verification
5. IP whitelisting
6. Webhook delivery webhooks (meta!)
7. Conditional triggers (only send if column X has value Y)
8. Batch mode (send multiple rows in one request)

---

## Testing Checklist

- [ ] Can create outbound webhook with valid URL
- [ ] Can select different trigger events
- [ ] Test button sends request and shows response
- [ ] Can pause/resume webhook
- [ ] Can delete webhook (with confirmation)
- [ ] Can view delivery history
- [ ] Invalid URLs show validation errors
- [ ] Webhook fires when event occurs (integration test)
- [ ] Multiple webhooks can coexist
- [ ] Keyboard navigation works
- [ ] Screen reader announces status changes


