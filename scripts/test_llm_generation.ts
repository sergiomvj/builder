
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing LLM Service...');
console.log('OpenAI Key present:', !!process.env.OPENAI_API_KEY);
console.log('OpenRouter Key present:', !!process.env.OPENROUTER_API_KEY);

async function test() {
    // Dynamic import ensures env is loaded first
    const { llmService } = await import('../src/lib/llm-service');

    const idea = "Uma plataforma SaaS para gestão de condomínios focada em automação de portaria e financeiro.";
    try {
        const start = Date.now();
        // Prioritize OpenRouter if available, since OpenAI key might be problematic or user prefers OR
        const config = process.env.OPENROUTER_API_KEY ? { provider: 'openrouter', model: 'gpt-4o' } : {};

        console.log(`Analyzing with config: ${JSON.stringify(config)}`);
        const result = await llmService.analyzeIdea(idea, config as any);
        const duration = Date.now() - start;

        console.log('--- Success ---');
        console.log(`Duration: ${duration}ms`);
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('--- Failure ---');
        console.error(error);
    }
}

test();
