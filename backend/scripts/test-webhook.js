require('dotenv').config({ path: './backend/.env.local' });
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const client = new PrismaClient();

async function createTestWebhook() {
    try {
        const tableId = 'table_test_' + Date.now();
        const userId = 'e72da235-26ec-449c-839f-b3ef797a1314';

        // Create table
        const table = await client.userTable.create({
            data: {
                id: tableId,
                userId: userId,
                name: 'Curl Test Table ' + new Date().toISOString(),
                sourceType: 'manual',
            },
        });

        console.log('✅ Table created:', table.id);

        // Create webhook with sample JSON for auto column creation
        const response = await axios.post(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/webhooks`, {
            tableId: table.id,
            sampleJson: JSON.stringify({
                email: 'auto@example.com',
                firstName: 'Auto',
                lastName: 'Generated',
                company: 'AutoCorp',
            }),
            isActive: true,
        }, {
            headers: {
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
        });
        const webhook = response.data.data;
        console.log('✅ Webhook created with ID:', webhook.id);
        console.log('   URL:', webhook.url);
        console.log('   API Key:', webhook.apiKey);

        console.log('\n📍 Webhook Details:');
        console.log('URL:', webhook.url);
        console.log('API Key:', webhook.apiKey);
        console.log('Table ID:', table.id);

        console.log('\n🧪 Test with curl:');
        console.log(`curl -X POST \\
  ${webhook.url} \\
  -H "x-api-key: ${webhook.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{\n    \"email\": \"test@example.com\",\n    \"firstName\": \"John\",\n    \"lastName\": \"Doe\",\n    \"company\": \"Acme Inc\"\n  }'`);
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.$disconnect();
    }
}

createTestWebhook();
