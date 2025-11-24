# Webhooks Documentation

Beton-AI provides comprehensive webhook functionality for seamless automation and external integrations.

## Incoming Webhooks

Receive data from external services and automatically populate your tables:

- **Unique URLs & API Keys** - Each table gets a dedicated webhook endpoint with secure API key authentication
- **Visible on Table Page** - Webhook URL and API key are prominently displayed on your table page for easy access
- **One-Click Copy** - Copy webhook URL and API key to clipboard with a single click
- **Streamlined Setup** - Single-screen configuration flow with inline field mapping and testing
- **Visual Field Mapping** - Map external JSON fields to table columns with dropdowns
- **Auto-Extraction** - Automatically detect and extract fields from sample JSON
- **Real-time Validation** - Instant feedback on required field mapping
- **Activity Stats** - Monitor total received webhooks and last received timestamp
- **Toggle Control** - Pause/resume webhooks without deleting configuration

### How to Find Your Webhook

1. Navigate to your table detail page
2. Look for the "Incoming Webhook" card below the table toolbar
3. Your webhook URL, API key, and stats are displayed in the card
4. Click the copy icon next to either field to copy to clipboard
5. Use the "Incoming Webhook" button in the toolbar to configure field mappings

**Security Note:** API keys are only shown in full when first created. After that, they're masked for security. Make sure to save your API key securely when you first create a webhook.

## Outbound Webhooks

Send data to external services when events occur in your tables:

- **Event Selection** - Choose which events trigger webhooks (row.created, row.updated, row.deleted)
- **URL Configuration** - Point to any HTTP(S) endpoint (Zapier, Make, custom APIs)
- **Delivery History** - View detailed logs of all webhook deliveries
- **Test Functionality** - Send test payloads to verify your endpoint
- **Auto-retry** - Automatic retry logic for failed deliveries
- **Pause/Resume** - Control webhook execution without losing configuration

### Use Cases

- Send new leads to your CRM automatically
- Trigger email campaigns when rows are added
- Sync data with third-party tools
- Build custom automation workflows
- Integrate with Zapier, Make, and other automation platforms

## Troubleshooting

- **Can't find webhook URL?** Make sure you've created an incoming webhook for your table using the "Incoming Webhook" button
- **Webhook not receiving data?** Check that the webhook is marked as "Active" in the webhook info card
- **Field mapping issues?** Ensure all required table columns are mapped to incoming JSON fields
- **API key not working?** Verify you're sending the API key in the request headers as specified in the documentation

See the [Webhook PRD](../prd/webhooks/) for detailed implementation guides.
