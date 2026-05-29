export async function retry<T>(
  operation: () => Promise<T>,
  options: { retries?: number; initialDelayMs?: number; shouldRetry?: (error: unknown) => boolean } = {},
): Promise<T> {
  const retries = options.retries ?? 2;
  const initialDelayMs = options.initialDelayMs ?? 300;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !shouldRetry(error)) break;
      await new Promise((resolve) => setTimeout(resolve, initialDelayMs * 2 ** attempt));
    }
  }

  throw lastError;
}
