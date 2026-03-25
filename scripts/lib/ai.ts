import { AI_PROVIDERS, DEFAULT_AI_PROVIDER } from '../../app/lib/config';
import type { AIProviderDefinition, AIProviderId } from '../../app/lib/types';
import { getApiKey } from './utils';

export interface AiRuntimeConfig {
    provider: AIProviderDefinition;
    model: string;
    apiKey: string;
}

type EnvMap = Record<string, string | undefined>;

function isAIProviderId(value: string): value is AIProviderId {
    return value in AI_PROVIDERS;
}

export function resolveAiRuntimeConfig(env: EnvMap = process.env): AiRuntimeConfig {
    const rawProvider = env.AI_PROVIDER?.trim().toLowerCase();
    const providerId = rawProvider ? rawProvider : DEFAULT_AI_PROVIDER;

    if (!isAIProviderId(providerId)) {
        throw new Error(`Unsupported AI provider: ${providerId}`);
    }

    const provider = AI_PROVIDERS[providerId];
    const apiKey = env[provider.apiKeyEnv]?.trim();

    if (!apiKey) {
        throw new Error(`Missing API key for provider ${providerId}: ${provider.apiKeyEnv}`);
    }

    return {
        provider,
        model: env.AI_MODEL?.trim() || provider.defaultModel,
        apiKey,
    };
}

export function loadAiRuntimeConfig(env: EnvMap = process.env): AiRuntimeConfig {
    const rawProvider = env.AI_PROVIDER?.trim().toLowerCase();
    const providerId = rawProvider ? rawProvider : DEFAULT_AI_PROVIDER;

    if (!isAIProviderId(providerId)) {
        throw new Error(`Unsupported AI provider: ${providerId}`);
    }

    const provider = AI_PROVIDERS[providerId];

    return {
        provider,
        model: env.AI_MODEL?.trim() || provider.defaultModel,
        apiKey: getApiKey(provider.apiKeyEnv, provider.apiKeyFile),
    };
}
