import { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';

interface PaymentConfig {
    email: string;
    amount: number; // in display currency (if needed for hook config, though we use access_code usually)
    publicKey: string;
}

interface StartPaymentArgs {
    plan: string;
    isAd?: boolean;
    isOneTime?: boolean; // One-time payment (no auto-renewal)
    postId?: string; // New Arg
    budget?: number; // New Arg for custom boost
    duration?: number; // New Arg for custom boost
    onSuccess?: (reference: string) => void;
    onError?: (error: string) => void;
}

export function usePayment() {
    const [isLoading, setIsLoading] = useState(false);

    const startPayment = async ({ plan, isAd, isOneTime, postId, budget, duration, onSuccess, onError }: StartPaymentArgs) => {
        setIsLoading(true);
        try {
            // 1. Call Backend to Initialize
            const res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, isAd, isOneTime, postId, budget, duration })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Initialization failed');
            }

            // 2. We have the Paystack Config from backend (Access Code is best for security)
            // But react-paystack hook needs config upfront or dynamic?
            // The hook 'usePaystackPayment' takes config.
            // If we want to use the hook dynamically, we need to initialize it with the config
            // returned from the backend. 

            // Actually, 'usePaystackPayment' is a hook that returns 'initializePayment'.
            // The config is passed to the hook.
            // Since we get the config ASYNC, we can't use the hook at the top level with static config.

            // Workaround: We can use the inline script directly or use the hook in a way where we just pass the necessary public key and then update config?
            // "react-paystack" might be tricky with async initialization.

            // Better approach for Async:
            // Use the "PaystackPop" method directly if we can, OR
            // Just use the hook but realize we need the config first.

            // Let's use the standard "PaystackPop" via window if available or the library's imperative method if it exposes one.
            // The library exports 'PaystackButton' and 'usePaystackPayment'.

            // If we use 'usePaystackPayment(config)', we need config.
            // We can fetch config, THEN mount a component that uses the hook? No that's complex.

            // Let's try the Access Code method.
            // If we have access_code, the config is simpler.

            const config = {
                reference: data.reference,
                email: 'user@example.com', // Filled by Paystack from access code usually? No, required.
                amount: 0, // Filled by access_code
                publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
                accessCode: data.accessCode, // THE KEY
            };

            // We need to dynamically call Paystack. 
            // Since we can't call hooks conditionally/async inside a function, 
            // lets use a "launcher" helper.

            // Actually, we can just instantiate the handler.
            // const initializePayment = usePaystackPayment(config); <--- RULES OF HOOKS VIOLATION if called here

            // SOLUTION: 
            // We need to store the config in state, let the hook read it, and then trigger?
            // Or just use the purely JS library `@paystack/inline-js` if `react-paystack` is inflexible?
            // User installed `react-paystack`.

            // Let's use the plain JS function provided by Paystack if we can export it, 
            // OR use a "Trigger" component pattern. 

            // For now, let's try a workaround: 
            // We'll return the config and a 'ready' state to the parent?
            // No, the parent wants "onClick -> Pay".

            // Let's assume we can use `window.PaystackPop` if we load the script?
            // Or import { PaystackConsumer } ...

            // Let's go with: Load the script manually for maximum control if the hook is annoying.
            // But we have `react-paystack`.

            // Let's try this:
            // 1. Fetch access code.
            // 2. Pass access code to a hidden helper component that automatically clicks itself? 

            // Wait, `react-paystack` documentation says `initializePayment(onSuccess, onClose)` is returned.
            // Can we change config? No.

            // OK, simpler: Do NOT use the backend initialization for the *hook configuration* if it makes it hard.
            // BUT we need backend to generate secure metadata/access code.

            // Let's implement `loadPaystack` manually in this hook to avoid hook limitations.

            const PaystackPop = (await import('@paystack/inline-js')).default;
            const popup = new PaystackPop();

            popup.newTransaction({
                key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
                accessCode: data.accessCode, // generated by backend
                onSuccess: (transaction: any) => {
                    // verify on backend
                    verify(transaction.reference, onSuccess, onError);
                },
                onCancel: () => {
                    setIsLoading(false);
                }
            });

        } catch (error: any) {
            console.error(error);
            onError?.(error.message);
            setIsLoading(false);
        }
    };

    const verify = async (reference: string, onSuccess?: (ref: string) => void, onError?: (err: string) => void) => {
        try {
            const res = await fetch(`/api/payments/verify?reference=${reference}`);
            const data = await res.json();
            if (res.ok && data.success) {
                onSuccess?.(reference);
            } else {
                throw new Error(data.error || 'Verification failed');
            }
        } catch (error: any) {
            onError?.(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { startPayment, isLoading };
}
