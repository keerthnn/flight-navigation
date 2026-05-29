"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = retry;
async function retry(operation, options = {}) {
    const retries = options.retries ?? 2;
    const initialDelayMs = options.initialDelayMs ?? 300;
    const shouldRetry = options.shouldRetry ?? (() => true);
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt === retries || !shouldRetry(error))
                break;
            await new Promise((resolve) => setTimeout(resolve, initialDelayMs * 2 ** attempt));
        }
    }
    throw lastError;
}
