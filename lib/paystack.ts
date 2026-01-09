export const Paystack = {
    initializeTransaction: async (email: string, amount: number, callbackUrl: string, metadata: any, plan?: string) => {
        const params: any = {
            email,
            amount: amount * 100, // Paystack expects kobo (cents)
            callback_url: callbackUrl,
            metadata: JSON.stringify(metadata)
        };
        if (plan) params.plan = plan; // If subscribing to a plan

        const res = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        return res.json();
    },

    verifyTransaction: async (reference: string) => {
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            }
        });
        return res.json();
    },

    // Manage Subscription via "Generate Link" doesn't strictly exist like Stripe Portal.
    // Usually handled via email sent by Paystack or unsubscribing via API.
    disableSubscription: async (code: string, token: string) => {
        const res = await fetch('https://api.paystack.co/subscription/disable', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, token })
        });
        return res.json();
    },

    enableSubscription: async (code: string, token: string) => {
        const res = await fetch('https://api.paystack.co/subscription/enable', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, token })
        });
        return res.json();
    }
};
