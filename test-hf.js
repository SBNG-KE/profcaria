require('dotenv').config({ path: '.env.local' });
const { HfInference } = require('@huggingface/inference');

const HF_TOKEN = process.env.HF_TOKEN;
const hf = new HfInference(HF_TOKEN);

async function test() {
    const models = [
        'Qwen/Qwen2.5-72B-Instruct',
        'mistralai/Mistral-Nemo-Instruct-2407',
        'meta-llama/Llama-3.2-3B-Instruct',
        'microsoft/Phi-3-mini-4k-instruct'
    ];

    for (const model of models) {
        console.log(`Testing ${model}...`);
        try {
            const resp = await hf.chatCompletion({
                model,
                messages: [{ role: 'user', content: 'Reply with JSON {"score": 90}' }],
                max_tokens: 50
            });
            console.log(`SUCCESS ${model}:`, resp.choices[0].message.content);
        } catch (err) {
            console.error(`FAILED ${model}:`, err.message);
        }
    }
}
test();
