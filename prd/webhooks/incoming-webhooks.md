# PRD: Incoming Webhooks UI

**Feature**: Allow users to receive data from external services via webhooks and automatically populate tables

**Priority**: High  
**Effort**: 3-4 days  
**Dependencies**: Backend webhook endpoints (commits 6-10)

---

## Overview

Enable users to generate unique webhook URLs for their tables that can receive POST requests from external services (Stripe, Typeform, Zapier, etc.). The system will map incoming JSON fields to table columns and automatically create rows.

---

## User Stories

1. **As a user**, I want to copy a unique webhook URL for my table so external services can send data to it
2. **As a user**, I want to configure field mappings the first time I set up a webhook so data goes into the correct columns
3. **As a user**, I want to test the webhook with sample data before going live
4. **As a user**, I want to see incoming webhook data in real-time to verify it's working
5. **As a user**, I want to pause/resume webhooks without losing the URL

---

## UI Components Breakdown

### Component 1: Webhook URL Button (Table Detail Page)

**Location**: `/dashboard/tables/[id]/page.tsx` - Add to toolbar alongside "Export CSV"

**COSS Components Used**:
- `Button` (outline variant) - Trigger button
- `DropdownMenu` - Advanced options menu
- `Dialog` - Configuration modal
- `Input` - URL display with copy button
- `Badge` - Status indicator (active/paused)
- `Separator` - Visual dividers

**Visual Structure**:
```tsx
<Button variant="outline" onClick={handleOpenWebhookConfig}>
  <Webhook className="h-4 w-4 mr-2" />
  Incoming Webhook
  {webhookExists && <Badge variant="secondary" className="ml-2">Active</Badge>}
</Button>
```

---

### Component 2: Webhook Configuration Modal

**COSS Components Used**:
- `Dialog` + `DialogContent` + `DialogHeader` + `DialogTitle` + `DialogDescription` + `DialogFooter`
- `Card` + `CardContent` + `CardHeader` + `CardTitle` - For sections
- `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` - Multi-step wizard
- `Input` - URL display, test data input
- `Button` - Actions (Copy, Test, Save, Pause/Resume)
- `Label` - Form labels
- `Select` + `SelectTrigger` + `SelectContent` + `SelectItem` - Column mapping dropdowns
- `Textarea` - JSON payload input
- `Badge` - Status indicators
- `Separator` - Section dividers
- `Alert` + `AlertDescription` - Warning messages
- `Checkbox` - Options (e.g., "Allow duplicates")

**Modal Layout** (3 Tabs):

#### Tab 1: Setup
```
┌─────────────────────────────────────────────┐
│ Configure Incoming Webhook                 │
│ Set up how external data flows into table   │
├─────────────────────────────────────────────┤
│ [Setup] [Test] [Manage]                    │
│                                             │
│ Webhook URL                                 │
│ ┌─────────────────────────────────────┐   │
│ │ https://api.beton.ai/webhooks/...   │ 📋│
│ └─────────────────────────────────────┘   │
│                                             │
│ Status: [●] Active                          │
│                                             │
│ ──────────────────────────────────────     │
│                                             │
│ Field Mapping                               │
│                                             │
│ [email] → [Select Column ▼] Email          │
│ [name]  → [Select Column ▼] Name           │
│ [phone] → [Select Column ▼] Phone          │
│                                             │
│ [+ Add Mapping]                             │
│                                             │
│ Options:                                    │
│ [✓] Skip duplicate entries                 │
│ [ ] Update existing on duplicate           │
│                                             │
│         [Cancel] [Save Configuration]       │
└─────────────────────────────────────────────┘
```

#### Tab 2: Test
```
┌─────────────────────────────────────────────┐
│ Test Webhook                                │
├─────────────────────────────────────────────┤
│ [Setup] [Test] [Manage]                    │
│                                             │
│ Send Test Data                              │
│ ┌────────────────┬──────────────────────┐  │
│ │ Paste JSON ▼   │ Mapped Result ▼      │  │
│ │                │                      │  │
│ │ {              │ email: test@ex.com   │  │
│ │   "email":...  │ name: John Doe       │  │
│ │   "name": ...  │ phone: +1234567890   │  │
│ │ }              │                      │  │
│ │                │                      │  │
│ │                │                      │  │
│ │                │                      │  │
│ └────────────────┴──────────────────────┘  │
│                                             │
│ [Send Test Request]                         │
│                                             │
│ Status: ✓ Test successful - Row created    │
│                                             │
│         [Cancel] [Go to Setup]              │
└─────────────────────────────────────────────┘
```

#### Tab 3: Manage
```
┌─────────────────────────────────────────────┐
│ Manage Webhook                              │
├─────────────────────────────────────────────┤
│ [Setup] [Test] [Manage]                    │
│                                             │
│ Webhook Status                              │
│ [● Active] [Switch to toggle]               │
│                                             │
│ Statistics                                  │
│ ┌─────────────────────────────────────┐   │
│ │ Total Received:    1,234            │   │
│ │ Last Received:     2 minutes ago    │   │
│ │ Created:           Oct 15, 2025     │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ Danger Zone                                 │
│ ┌─────────────────────────────────────┐   │
│ │ [Delete Webhook]                    │   │
│ │ This will permanently delete the    │   │
│ │ webhook URL. External services will │   │
│ │ stop working.                       │   │
│ └─────────────────────────────────────┘   │
│                                             │
│                      [Close]                │
└─────────────────────────────────────────────┘
```

---

## Component Files to Create

### 1. `/frontend/src/components/webhooks/IncomingWebhookButton.tsx`
**Purpose**: Trigger button in table toolbar
**Exports**: `IncomingWebhookButton`

### 2. `/frontend/src/components/webhooks/IncomingWebhookModal.tsx`
**Purpose**: Main configuration modal with 3 tabs
**Exports**: `IncomingWebhookModal`
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
- Textarea

### 3. `/frontend/src/components/webhooks/FieldMappingBuilder.tsx`
**Purpose**: Reusable field mapping UI
**Exports**: `FieldMappingBuilder`
**Components Used**:
- Card, CardContent
- Select, SelectTrigger, SelectContent, SelectItem
- Button
- Label
- Badge

### 4. `/frontend/src/components/webhooks/WebhookTestPanel.tsx`
**Purpose**: Test panel with split view
**Exports**: `WebhookTestPanel`
**Components Used**:
- Card, CardContent
- Textarea
- Button
- Badge
- Alert

---

## API Integration

### Frontend API Client (`frontend/src/lib/api.ts`)

Add to `apiClient`:
```typescript
webhooks: {
  // Incoming webhooks
  createIncoming: (tableId: string, mapping: Record<string, string>) => 
    api.post('/api/webhooks', { tableId, mapping }),
  
  listIncoming: () => 
    api.get('/api/webhooks'),
  
  deleteIncoming: (webhookId: string) => 
    api.delete(`/api/webhooks/${webhookId}`),
  
  testIncoming: (webhookId: string, payload: any) =>
    api.post(`/api/webhooks/${webhookId}/test`, payload),
}
```

---

## User Flow

### First-Time Setup Flow
1. User clicks "Incoming Webhook" button on table detail page
2. Modal opens to "Setup" tab (empty state)
3. System generates webhook URL automatically
4. User sees field mapping interface
5. User maps JSON fields to table columns
6. User clicks "Save Configuration"
7. Webhook is now active and ready to receive data

### Existing Webhook Flow
1. User clicks "Incoming Webhook" button
2. Modal opens to "Manage" tab (existing webhook)
3. User can toggle webhook on/off
4. User can view statistics
5. User can switch to "Test" tab to send test data
6. User can switch to "Setup" tab to edit mappings

### Testing Flow
1. User switches to "Test" tab
2. User pastes sample JSON from external service
3. User clicks "Send Test Request"
4. System shows mapped result on right side
5. If successful, row is created in table
6. User can verify row was created correctly

---

## Edge Cases & Error Handling

1. **No columns in table**: Show warning "Add columns to your table first"
2. **Invalid JSON in test**: Show error "Invalid JSON format"
3. **Missing required mappings**: Disable save until all required fields mapped
4. **Webhook delivery failures**: Log but don't show to user (backend handles)
5. **Duplicate webhook**: Use existing webhook, don't create new one

---

## Accessibility

- All interactive elements keyboard navigable
- ARIA labels on all buttons
- Form validation with clear error messages
- Focus management in modal
- Screen reader announcements for status changes

---

## Implementation Notes

1. Use existing `CsvUploadModal.tsx` as reference for modal structure
2. Follow COSS component patterns from `comp-485.tsx` and `comp-589.tsx`
3. Maintain consistent button variants across app
4. Use toast notifications for success/error feedback
5. Store webhook state in React state, sync with backend


