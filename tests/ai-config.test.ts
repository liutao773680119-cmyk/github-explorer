import test from 'node:test';
import assert from 'node:assert/strict';

import type { AiRuntimeConfig, VertexRuntimeConfig } from '../scripts/lib/ai';
import { resolveAiRuntimeConfig } from '../scripts/lib/ai';

function assertVertexRuntimeConfig(config: AiRuntimeConfig): asserts config is VertexRuntimeConfig {
    assert.equal(config.provider.transport, 'vertex');
}

test('未设置 AI_PROVIDER 时默认使用 deepseek', () => {
    const config = resolveAiRuntimeConfig({
        DEEPSEEK_API_KEY: 'deepseek-test-key',
    });

    assert.equal(config.provider.id, 'deepseek');
    assert.equal(config.model, 'deepseek-chat');
    assert.equal(config.apiKey, 'deepseek-test-key');
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

test('设置 AI_PROVIDER=vertex-gemini 时使用 Vertex 配置而非 API Key', () => {
    const config = resolveAiRuntimeConfig({
        AI_PROVIDER: 'vertex-gemini',
        VERTEX_GEMINI_PROJECT: 'vertex-demo-project',
    });

    assert.equal(config.provider.id, 'vertex-gemini');
    assertVertexRuntimeConfig(config);
    assert.equal(config.model, 'gemini-2.5-flash');
    assert.equal(config.vertexProject, 'vertex-demo-project');
    assert.equal(config.vertexLocation, 'us-central1');
    assert.equal(config.apiKey, undefined);
});

test('vertex-gemini 支持复用 Google Cloud 标准环境变量', () => {
    const config = resolveAiRuntimeConfig({
        AI_PROVIDER: 'vertex-gemini',
        GOOGLE_CLOUD_PROJECT: 'shared-google-cloud-project',
        GOOGLE_CLOUD_LOCATION: 'asia-east1',
    });

    assert.equal(config.provider.id, 'vertex-gemini');
    assertVertexRuntimeConfig(config);
    assert.equal(config.vertexProject, 'shared-google-cloud-project');
    assert.equal(config.vertexLocation, 'asia-east1');
});

test('vertex-gemini 缺少 project 时抛出明确错误', () => {
    assert.throws(
        () => resolveAiRuntimeConfig({ AI_PROVIDER: 'vertex-gemini' }),
        /Missing Vertex project/,
    );
});

test('未知 provider 抛出明确错误', () => {
    assert.throws(
        () => resolveAiRuntimeConfig({ AI_PROVIDER: 'unknown-provider' }),
        /Unsupported AI provider/,
    );
});
