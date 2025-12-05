# Webhook UI Features - Product Requirements

This directory contains comprehensive PRDs for the webhook UI implementation in Beton-AI.

---

## 📁 Document Structure

### 1. [incoming-webhooks.md](./incoming-webhooks.md)
**Complete PRD for Incoming Webhooks**

**Key Features**:
- Generate unique webhook URLs for tables
- Visual field mapping builder
- Real-time test with JSON preview
- Active/pause toggle
- Statistics dashboard

**Effort**: 3-4 days  
**Components**: 15 unique COSS components  
**Files**: 4 new component files

---

### 2. [outbound-webhooks.md](./outbound-webhooks.md)
**Complete PRD for Outbound Webhooks**

**Key Features**:
- Send data to external URLs on events
- Event trigger configuration (row.created, row.updated)
- Delivery history tracking
- Test functionality with response preview
- Active/pause toggle

**Effort**: 2-3 days  
**Components**: 18 unique COSS components  
**Files**: 3 new component files

---

### 3. [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
**Unified Implementation Guide**

**Contents**:
- Complete COSS component inventory (25 components documented)
- Component reusability matrix
- File structure and naming conventions
- State management patterns
- API integration specifications
- Testing strategy
- Code style guidelines
- Responsive design breakpoints
- Accessibility requirements
- Security validation patterns

---

## 🎯 Quick Summary

### Total Effort
- **Incoming Webhooks**: 3-4 days (24-32 hours)
- **Outbound Webhooks**: 2-3 days (16-24 hours)
- **Total**: 5-7 days (40-56 hours)

### COSS Components Used

**Core Components** (both features):
- Dialog system (6 sub-components)
- Button (5 variants)
- Card system (4 sub-components)
- Tab system (4 sub-components)
- Form components (Input, Label, Select, Textarea, Checkbox)
- Badge, Separator, Alert

**Unique to Incoming**:
- Custom field mapping builder
- Split-panel test view
- JSON validator

**Unique to Outbound**:
- DropdownMenu system (5 sub-components)
- Table component for delivery log
- Payload preview panel

### Files to Create

```
frontend/src/components/webhooks/
├── IncomingWebhookButton.tsx       (150 lines)
├── IncomingWebhookModal.tsx        (400 lines)
├── OutboundWebhookButton.tsx       (100 lines)
├── OutboundWebhookModal.tsx        (350 lines)
├── FieldMappingBuilder.tsx         (200 lines)
├── WebhookTestPanel.tsx            (150 lines)
├── WebhookDeliveryLog.tsx          (100 lines)
└── types.ts                        (50 lines)

Total: ~1,500 lines of UI code
```

### Files to Modify

```
frontend/src/app/dashboard/tables/[id]/page.tsx
  - Add webhook buttons to toolbar
  - Add state management
  - Add event handlers
  (+50 lines)

frontend/src/lib/api.ts
  - Add webhook API methods
  (+80 lines)
```

---

## 📊 Component Reusability

**Shared Components** (used by both features):
1. `FieldMappingBuilder.tsx` - Visual field mapping interface
2. `WebhookTestPanel.tsx` - Test webhook functionality
3. `WebhookDeliveryLog.tsx` - Show delivery history
4. `types.ts` - Shared TypeScript interfaces

**Reusability Benefits**:
- Consistent UX across features
- Reduced code duplication (~30% less code)
- Easier maintenance
- Unified design language

---

## 🎨 Design Consistency

### All Modals Use Same Pattern
```
1. DialogHeader with icon + title
2. DialogDescription for context
3. Tabs for multi-step flows (if applicable)
4. Form fields with Labels
5. Visual feedback (Alerts, Badges)
6. DialogFooter with Cancel + Primary action
```

### All Buttons Follow Variant System
- **default**: Primary actions (Create, Save, Test)
- **outline**: Secondary actions (Cancel, Close)
- **ghost**: Icon-only actions (Copy, More options)
- **destructive**: Dangerous actions (Delete)

### All Status Indicators Use Badges
- Active: Green
- Paused: Gray
- Testing: Yellow
- Error: Red

---

## 🧪 Testing Coverage

### Unit Tests (Jest)
- Component rendering
- Form validation
- User interactions
- Error states
- Loading states

### Integration Tests (Playwright/Cypress)
- Full webhook creation flow
- Field mapping configuration
- Test webhook with sample data
- Toggle webhook on/off
- Delete webhook

### Manual Testing Checklist
- [ ] Create incoming webhook
- [ ] Map fields correctly
- [ ] Send test data
- [ ] Verify row created
- [ ] Toggle webhook off
- [ ] Verify no rows created
- [ ] Toggle webhook on
- [ ] Delete webhook
- [ ] Create outbound webhook
- [ ] Select events
- [ ] Test outbound endpoint
- [ ] Create row, verify webhook fired
- [ ] View delivery history
- [ ] Pause webhook
- [ ] Resume webhook
- [ ] Delete outbound webhook

---

## 🚦 Implementation Phases

### Phase 1: Incoming Webhooks (Week 1)
**Goal**: Users can receive webhook data

**Deliverables**:
- Webhook URL generation UI
- Field mapping interface
- Test functionality
- Active/pause toggle
- Basic statistics

**Acceptance**: User can configure and test incoming webhook in < 3 minutes

---

### Phase 2: Outbound Webhooks (Week 1-2)
**Goal**: Users can send webhook data

**Deliverables**:
- Export dropdown with webhook option
- Webhook configuration UI
- Event selection
- Test functionality
- Delivery history
- Active/pause toggle

**Acceptance**: User can create and test outbound webhook in < 2 minutes

---

### Phase 3: Polish & Documentation (Week 2)
**Goal**: Production-ready release

**Deliverables**:
- Comprehensive error handling
- Loading states for all async operations
- Accessibility audit and fixes
- Mobile responsive testing
- Component documentation
- User guide with screenshots
- Video tutorial (optional)

**Acceptance**: All accessibility tests pass, mobile UX validated

---

## 📈 Success Metrics

### Adoption Metrics
- % of tables with incoming webhooks: Target 30% after 1 month
- % of tables with outbound webhooks: Target 20% after 1 month
- Average webhooks per user: Target 2-3

### Performance Metrics
- Webhook configuration completion rate: Target > 85%
- Test success rate: Target > 90%
- Delivery success rate: Target > 98%

### UX Metrics
- Time to first webhook: Target < 3 minutes
- User confusion rate: Target < 10%
- Support tickets related to webhooks: Target < 5% of all tickets

---

## 🔮 Future Enhancements (Post-MVP)

### V2 Features
1. **Advanced Field Mapping**
   - JSONPath selectors for nested fields
   - Custom transformation functions
   - Default values and fallbacks

2. **Webhook Security**
   - HMAC signature generation/verification
   - API key authentication
   - IP whitelisting

3. **Advanced Filtering**
   - Conditional triggers (only send if X = Y)
   - Column-specific updates (only trigger on specific columns)
   - Batch mode (send multiple rows)

4. **Monitoring & Alerts**
   - Email alerts on webhook failures
   - Delivery success rate dashboard
   - Failed delivery retry UI

5. **Templates**
   - Pre-configured mappings for popular services
   - Stripe webhook template
   - Typeform webhook template
   - Custom payload templates

---

## 🤝 Integration Examples

### Stripe → Beton (Incoming)
```
1. Create table "Stripe Payments"
2. Add columns: email, amount, stripe_id
3. Create incoming webhook
4. Map:
   - data.object.customer_email → email
   - data.object.amount → amount
   - data.object.id → stripe_id
5. Copy webhook URL
6. Add to Stripe dashboard
7. Test with sample payment
```

### Beton → CRM (Outbound)
```
1. Open table "Leads"
2. Click Export → Send to Webhook
3. Enter CRM webhook URL
4. Select event: "row.created"
5. Test webhook
6. Verify CRM receives data
7. Save webhook
8. New rows automatically sync to CRM
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: "Webhook URL not working"
**Solution**: Check that webhook is Active, verify URL in external service is correct

**Issue**: "Field mapping not saving"
**Solution**: Ensure all required fields are mapped, refresh page and try again

**Issue**: "Test data not creating row"
**Solution**: Verify JSON format matches expected structure, check field names match exactly

**Issue**: "Outbound webhook not firing"
**Solution**: Check webhook is Active, verify event is selected, check table actually had the event occur

---

## 📝 Changelog

### Version 1.0 (MVP) - October 2025
- Initial release
- Incoming webhooks with field mapping
- Outbound webhooks with basic events
- Test functionality for both
- Active/pause toggles
- Basic delivery tracking

### Version 1.1 (Planned) - November 2025
- Advanced field transformations
- HMAC signatures
- Conditional triggers
- Email alerts on failures

---

## 👥 Stakeholders

- **Product**: Define webhook use cases and priority
- **Engineering**: Implement UI and backend integration
- **Design**: Review component usage and accessibility
- **QA**: Test all flows and edge cases
- **Documentation**: Create user guides and tutorials

---

## 🎓 Learning Resources

### COSS Component Library
- Component docs: https://coss.com/origin
- GitHub: Component source code in `frontend/src/components/ui/`

### React Patterns
- Dialog management with state
- Form validation patterns
- Optimistic UI updates
- Error boundary implementation

### Webhook Best Practices
- Idempotency in webhook receivers
- Retry strategies with exponential backoff
- Signature verification for security
- Payload size limits


