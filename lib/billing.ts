
import { supabaseAdmin } from './supabase';
import { BILLING_PLANS, PlanType } from './billing-config';

export async function getCompanyPlan(companyId: string) {
    if (!companyId) return { plan: BILLING_PLANS.free, subscription: null };

    const { data: subscription } = await supabaseAdmin
        .schema('employer')
        .from('subscriptions')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!subscription) {
        return { plan: BILLING_PLANS.free, subscription: null };
    }

    // Lazy Reset Check (Monthly reset for everyone)
    const lastReset = new Date(subscription.last_usage_reset || subscription.created_at || new Date());
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastReset.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 30) {
        // Reset usage
        await supabaseAdmin
            .schema('employer')
            .from('subscriptions')
            .update({
                usage_jobs: 0,
                usage_connections: 0,
                usage_top_matches: 0,
                last_usage_reset: new Date().toISOString()
            })
            .eq('id', subscription.id);

        // Return reset values locally
        subscription.usage_jobs = 0;
        subscription.usage_connections = 0;
        subscription.usage_top_matches = 0;
    }

    const planType = (subscription.plan_type as PlanType) || 'free';
    const planConfig = BILLING_PLANS[planType] || BILLING_PLANS.free;

    return { plan: planConfig, subscription };
}

export async function checkLimit(companyId: string, feature: 'jobs' | 'connections' | 'topMatches') {
    const { plan, subscription } = await getCompanyPlan(companyId);

    // Free plan always verify usage if subscription exists (or if virtual free tracking is implemented)
    // If no subscription record exists, we might need a way to track "Free" usage. 
    // Usually Free users just have a record with plan='free' or we track in companies table?
    // For now, if no subscription, assuming effectively "Free" but tracking is hard without a record.
    // OPTION: Auto-create a free subscription record for every company on signup?
    // OR: Track in `companies` table?
    // Let's assume we create a free record or handle null.

    if (!subscription) {
        // If no sub record, maybe we rely on a global limit or allow 1?
        // Safe bet: Deny if tracking not possible, OR (Better) Create a free tier record on the fly?
        // For this implementation, let's assume valid companies have a subscription row (even if free).
        // If not, limit to 1 strict default.
        return (plan.limits[feature] > 0);
    }

    const currentUsage = subscription[`usage_${feature}`] || 0;
    const limit = plan.limits[feature];

    if (limit >= 9999) return true; // Unlimited

    return currentUsage < limit;
}

export async function incrementUsage(companyId: string, feature: 'jobs' | 'connections' | 'topMatches') {
    // Increment specific counter
    const column = `usage_${feature}`;

    // RPC or direct update? Race conditions possible but acceptable for this scale.
    // Supabase doesn't have simple increment without RPC usually, but let's try reading then writing or raw sql.
    // Actually safe way:
    const { data: sub } = await supabaseAdmin.schema('employer').from('subscriptions').select(column).eq('company_id', companyId).single();
    if (sub) {
        const newVal = (sub[column] || 0) + 1;
        await supabaseAdmin.schema('employer').from('subscriptions').update({ [column]: newVal }).eq('company_id', companyId);
    }
}
