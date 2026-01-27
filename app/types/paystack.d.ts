declare module '@paystack/inline-js' {
    export default class PaystackPop {
        newTransaction(config: {
            key: string;
            email?: string;
            amount?: number;
            ref?: string;
            accessCode?: string;
            onSuccess?: (transaction: any) => void;
            onCancel?: () => void;
            onClose?: () => void;
        }): void;
    }
}
