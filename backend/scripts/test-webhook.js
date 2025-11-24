const prisma = require('@prisma/client').PrismaClient;
const crypto = require('crypto');

const client = new prisma();

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
                sourceType: 'manual'
            }
        });

        console.log('✅ Table created:', table.id);

        // Create webhook
        const uniqueId = 'test_' + Date.now();
        const apiKey = 'whk_live_' + crypto.randomBytes(16).toString('hex');
        const webhookUrl = `http://localhost:3001/api/webhooks/receive/${uniqueId}`;

        const webhook = await client.incomingWebhook.create({
            data: {
                userId: userId,
                tableId: table.id,
                url: webhookUrl,
                apiKey: apiKey,
                fieldMapping: {},
                isActive: true
            }
        });

        console.log('\n📍 Webhook Details:');
        console.log('URL:', `https://backend-test-1c84.up.railway.app/api/webhooks/receive/${uniqueId}`);
        console.log('API Key:', apiKey);
        console.log('Table ID:', table.id);

        console.log('\n🧪 Test with curl:');
        console.log(`curl -X POST \\
  https://backend-test-1c84.up.railway.app/api/webhooks/receive/${uniqueId} \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Acme Inc"
  }'`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.$disconnect();
    }
}

createTestWebhook();
