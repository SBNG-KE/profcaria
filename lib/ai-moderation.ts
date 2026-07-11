import { HfInference } from '@huggingface/inference';

// Reuse the existing token
const HF_TOKEN = process.env.HF_TOKEN;

// Zero-Shot Classification Model
const MODERATION_MODEL = 'facebook/bart-large-mnli';

// Definitions for classification
const LABELS = [
    'professional job title',
    'offensive or inappropriate content',
    'random gibberish or spam',
    'not a job role'
];

export async function validateJobCategory(text: string): Promise<{ valid: boolean; reason?: string }> {
    const normalized = text.trim().replace(/\s+/g, ' ');
    if (normalized.length < 2 || normalized.length > 120) return { valid: false, reason: 'Use a job title between 2 and 120 characters.' };
    if (/https?:\/\/|www\.|@\w+|\b(?:whatsapp|telegram)\b/i.test(normalized)) return { valid: false, reason: 'Job titles cannot contain links or contact handles.' };
    if (/(.)\1{4,}/i.test(normalized) || (normalized.match(/[a-z]/gi)?.length || 0) / normalized.length < 0.45) return { valid: false, reason: 'Use a clear professional job title.' };
    if (/\b(?:idiot|stupid|sexy|nude|porn|scam|fraud|terrorist|slave)\b/i.test(normalized)) return { valid: false, reason: 'This job title contains inappropriate or unsafe language.' };
    if (normalized.split(' ').length > 14) return { valid: false, reason: 'Use the role name as the title and put details in the description.' };

    if (!HF_TOKEN) {
        console.warn('HF_TOKEN missing; deterministic job-title moderation remains active');
        return { valid: true };
    }

    const hf = new HfInference(HF_TOKEN);

    try {
        const response = await hf.zeroShotClassification({
            model: MODERATION_MODEL,
            inputs: text,
            parameters: {
                candidate_labels: LABELS,
                multi_label: false
            }
        });

        console.log('[AI Moderation] Raw Response:', JSON.stringify(response, null, 2));

        let topLabel: string | undefined;
        let topScore: number | undefined;

        // Handle Array of Objects format (e.g. [{ label: 'A', score: 0.9 }, ...])
        if (Array.isArray(response) && response.length > 0 && typeof response[0] === 'object' && 'label' in response[0]) {
            topLabel = response[0].label;
            topScore = response[0].score;
        }
        // Handle Parallel Arrays format (legacy or different models)
        else {
            const result = (Array.isArray(response) ? response[0] : response) as { labels?: string[]; scores?: number[] };
            topLabel = result?.labels?.[0];
            topScore = result?.scores?.[0];
        }

        // Fail open if structure is unexpected (so we don't block users due to API bugs)
        if (!topLabel || topScore === undefined || topScore === null) {
            console.warn('[AI Moderation] Unexpected response format (no labels/scores). Allowing.');
            return { valid: true };
        }

        console.log(`[AI Moderation] Input: "${text}" -> Label: "${topLabel}" (${(topScore * 100).toFixed(1)}%)`);

        // Rules
        // 1. Must be identified as 'professional job title' with decent confidence
        if (topLabel !== 'professional job title') {
            // ... existing checks ...
            if (topLabel === 'offensive or inappropriate content') {
                return { valid: false, reason: 'Content flagged as inappropriate.' };
            }
            if (topLabel === 'random gibberish or spam') {
                return { valid: false, reason: 'This does not appear to be a meaningful category.' };
            }
            return { valid: false, reason: 'This does not appear to be a valid job category.' };
        }

        // 2. Even if it matches, score should be reasonably high (e.g. > 0.4 because zero-shot can be fuzzy)
        // If score is low, it means it's ambiguous
        if (topScore < 0.4) {
            return { valid: false, reason: 'We could not verify this as a valid job category. Please use a standard job title.' };
        }

        return { valid: true };

    } catch (error) {
        console.error('AI Moderation Failed:', error);
        // Fail open or closed? For safety, usually fail closed, but for UX reliability maybe fail open if API is down?
        // Let's fail open but log it, so users aren't blocked by API outages.
        return { valid: true };
    }
}
