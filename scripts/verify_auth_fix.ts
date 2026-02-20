// scripts/verify_auth_fix.ts
// Run against your local dev server or staging
// Usage: npx ts-node scripts/verify_auth_fix.ts

async function run() {
    const targetUrl = process.env.API_URL || 'http://localhost:3000/api/auth/social';

    console.log(`Testing auth bypass against: ${targetUrl}`);

    const payload = {
        email: "target@example.com",
        role: "professional",
        provider: "google",
        providerId: "123"
    };

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // Deliberately omitting the Authorization header
            },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        const text = await response.text();

        if (status === 401) {
            console.log(`✅ SUCCESS: Attack failed with 401 Unauthorized.`);
            console.log(`Response body: ${text}`);
            process.exit(0);
        } else {
            console.error(`❌ FAILURE: Endpoint returned status ${status} instead of 401.`);
            console.error(`Response body: ${text}`);
            process.exit(1);
        }
    } catch (err) {
        console.error(`Connection error: ${err}`);
        process.exit(1);
    }
}

run();
