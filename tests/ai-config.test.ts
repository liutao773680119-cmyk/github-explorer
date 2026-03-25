import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveAiRuntimeConfig } from '../scripts/lib/ai';

test('未设置 AI_PROVIDER 时默认使用 gemini', () => {
    const config = resolveAiRuntimeConfig({
        GEMINI_API_KEY: 'gemini-test-key',
    });

    assert.equal(config.provider.id, 'gemini');
    assert.equal(config.model, 'gemini-2.5-flash-lite');
    assert.equal(config.apiKey, 'gemini-test-key');
});

test('设置 AI_PROVIDER=deepseek 时切换到 deepseek 默认配置', () => {
    const config = resolveAiRuntimeConfig({
        AI_PROVIDER: 'deepseek',
        DEEPSEEK_API_KEY: 'deepseek-test-key',
    });

    assert.equal(config.provider.id, 'deepseek');
    assert.equal(config.model, 'deepseek-chat');
    assert.equal(config.apiKey, 'deepseek-test-key');
});

test('设置 AI_MODEL 时覆盖 provider 默认模型', () => {
    const config = resolveAiRuntimeConfig({
        AI_PROVIDER: 'openai',
        AI_MODEL: 'gpt-4.1-mini',
        OPENAI_API_KEY: 'openai-test-key',
    });

    assert.equal(config.provider.id, 'openai');
    assert.equal(config.model, 'gpt-4.1-mini');
    assert.equal(config.apiKey, 'openai-test-key');
});

test('未知 provider 抛出明确错误', () => {
    assert.throws(
        () => resolveAiRuntimeConfig({ AI_PROVIDER: 'unknown-provider' }),
        /Unsupported AI provider/,
    );
});
