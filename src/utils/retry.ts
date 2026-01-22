import axios from 'axios';

interface RetryOptions {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors?: (error: unknown) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxAttempts: 4,
    initialDelay: 2000,      // 2 seconds
    maxDelay: 16000,         // 16 seconds
    backoffMultiplier: 2,
    retryableErrors: (error: unknown) => {
        // Only retry on network errors and 5xx/429
        if (axios.isAxiosError(error)) {
            if (!error.response) return true;  // Network error
            const status = error.response.status;
            return status >= 500 || status === 429;  // Server errors or rate limit
        }
        return false;
    }
};

export async function withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: unknown;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error: unknown) {
            lastError = error;

            // Check if we should retry
            const shouldRetry = opts.retryableErrors?.(error) ?? false;
            const isLastAttempt = attempt === opts.maxAttempts;

            if (!shouldRetry || isLastAttempt) {
                throw error;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
                opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
                opts.maxDelay
            );

            console.warn(
                `[Retry] Attempt ${attempt}/${opts.maxAttempts} failed. ` +
                `Waiting ${delay}ms before retry...`,
                error instanceof Error ? error.message : String(error)
            );

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}
