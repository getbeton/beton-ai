# Integrations

Beton-AI connects with various external services to power your workflows.

## 🤝 Apollo Integration

Beton-AI talks directly to Apollo's public API in all environments. The mock Apollo service has been removed in favor of real API integration.

### How it works

1. Add your Apollo API key securely via the Integrations page
2. The backend validates your key through Supabase-authenticated routes
3. All searches use the real Apollo API with your credentials
4. Background jobs handle bulk downloads with rate limiting and retry logic

## 🧠 OpenAI Integration

Leverage OpenAI for intelligent data processing and enrichment.

*   **API Key**: Manage your OpenAI API keys securely.
*   **Usage**: Power AI features within your tables and workflows.

## 📧 Findymail Integration

Connect with Findymail for email verification and discovery.

*   **Integration**: Securely store and manage Findymail API keys.
*   **Functionality**: Verify email addresses directly within your data tables.
