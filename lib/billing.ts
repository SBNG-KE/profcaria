
import { supabaseAdmin } from './supabase';
import { BILLING_PLANS, PlanType } from './billing-config';

export async function getCompanyPlan(companyId: string) {
    if (!companyId) return { plan: BILLING_PLANS.free, subscription: null };

    // Valid Plans Priority
    const PRIORITY: Record<string, number> = {
        'enterprise': 4,
        'pro': 3,
        'basic': 2,
        'free': 1
    };

    // Fetch potential active subscriptions (handle duplicates/race conditions)
    const { data: subs } = await supabaseAdmin
        .schema('employer')
        .from('subscriptions')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

    if (!subs || subs.length === 0) {
        return { plan: BILLING_PLANS.free, subscription: null };
    }

    // Smart Selection: Prefer Paid > Free
    const subscription = subs.sort((a: any, b: any) => {
        const pA = PRIORITY[a.plan_type as string] || 1;
        const pB = PRIORITY[b.plan_type as string] || 1;
        if (pA !== pB) return pB - pA; // Higher priority first
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Newer first
    })[0];

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
        // Auto-initialize if missing to ensure we track usage correctly from the start.
        // This prevents the "infinite free actions" bug where checkLimit returns true because it assumes 0 usage.
        const { data: newSub } = await supabaseAdmin
            .schema('employer')
            .from('subscriptions')
            .insert([{
                company_id: companyId,
                plan_type: 'free',
                [`usage_${feature}`]: 0
            }])
            .select()
            .single();

        if (newSub) {
            // Re-evaluate with the new subscription
            const limit = plan.limits[feature];
            if (limit >= 9999) return true;
            return (newSub[`usage_${feature}`] || 0) < limit;
        }

        // Fallback if insertion failed (should receive error, but strictly block if we can't track)
        return false;
    }

    const currentUsage = subscription[`usage_${feature}`] || 0;
    const limit = plan.limits[feature];

    if (limit >= 9999) return true; // Unlimited

    return currentUsage < limit;
}

export async function incrementUsage(companyId: string, feature: 'jobs' | 'connections' | 'topMatches') {
    const column = `usage_${feature}`;

    // Try to find existing subscription
    const { data: sub } = await supabaseAdmin
        .schema('employer')
        .from('subscriptions')
        .select(`id, ${column}`)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (sub) {
        const newVal = (sub[column] || 0) + 1;
        await supabaseAdmin
            .schema('employer')
            .from('subscriptions')
            .update({ [column]: newVal })
            .eq('id', sub.id);
    } else {
        // Auto-initialize Free Tier if missing
        await supabaseAdmin
            .schema('employer')
            .from('subscriptions')
            .insert([{ company_id: companyId, plan_type: 'free', [column]: 1 }]);
    }
}
