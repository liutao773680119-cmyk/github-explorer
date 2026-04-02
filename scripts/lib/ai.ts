import { AI_PROVIDERS, DEFAULT_AI_PROVIDER } from '../../app/lib/config';
import type {
    AIProviderId,
    OpenAICompatibleProviderDefinition,
    VertexAIProviderDefinition,
} from '../../app/lib/types';
import { getApiKey } from './utils';

export interface OpenAIRuntimeConfig {
    provider: OpenAICompatibleProviderDefinition;
    model: string;
    apiKey: string;
}

export interface VertexRuntimeConfig {
    provider: VertexAIProviderDefinition;
    model: string;
    apiKey?: undefined;
    vertexProject: string;
    vertexLocation: string;
    apiVersion: 'v1';
}

export type AiRuntimeConfig = OpenAIRuntimeConfig | VertexRuntimeConfig;

type EnvMap = Record<string, string | undefined>;

function isAIProviderId(value: string): value is AIProviderId {
    return value in AI_PROVIDERS;
}

function getVertexProject(provider: VertexAIProviderDefinition, env: EnvMap): string {
    const project = env[provider.projectEnv]?.trim() || env[provider.projectFallbackEnv]?.trim();

    if (!project) {
        throw new Error(
            `Missing Vertex project for provider ${provider.id}: ${provider.projectEnv} or ${provider.projectFallbackEnv}`,
        );
    }

    return project;
}

function getVertexLocation(provider: VertexAIProviderDefinition, env: EnvMap): string {
    return env[provider.locationEnv]?.trim()
        || env[provider.locationFallbackEnv]?.trim()
        || provider.locationDefault;
}

export function resolveAiRuntimeConfig(env: EnvMap = process.env): AiRuntimeConfig {
    const rawProvider = env.AI_PROVIDER?.trim().toLowerCase();
    const providerId = rawProvider ? rawProvider : DEFAULT_AI_PROVIDER;

    if (!isAIProviderId(providerId)) {
        throw new Error(`Unsupported AI provider: ${providerId}`);
    }

    const provider = AI_PROVIDERS[providerId];

    if (provider.transport === 'vertex') {
        return {
            provider,
            model: env.AI_MODEL?.trim() || provider.defaultModel,
            vertexProject: getVertexProject(provider, env),
            vertexLocation: getVertexLocation(provider, env),
            apiVersion: provider.apiVersion,
        };
    }

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

    if (provider.transport === 'vertex') {
        return {
            provider,
            model: env.AI_MODEL?.trim() || provider.defaultModel,
            vertexProject: getVertexProject(provider, env),
            vertexLocation: getVertexLocation(provider, env),
            apiVersion: provider.apiVersion,
        };
    }

    return {
        provider,
        model: env.AI_MODEL?.trim() || provider.defaultModel,
        apiKey: getApiKey(provider.apiKeyEnv, provider.apiKeyFile),
    };
}
