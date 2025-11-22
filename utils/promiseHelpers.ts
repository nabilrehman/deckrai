/**
 * Promise utility functions for timeout and retry handling
 */

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param ms Timeout in milliseconds
 * @param errorMessage Custom error message
 * @returns Promise that rejects if timeout is exceeded
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  errorMessage?: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(errorMessage || `Operation timed out after ${ms}ms`)),
        ms
      )
    )
  ]);
};

/**
 * Retries a promise-returning function with exponential backoff
 * @param fn The function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param baseDelay Initial delay in milliseconds (doubles each retry)
 * @returns Promise that resolves with the result or rejects after max retries
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[retryWithBackoff] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Max retries (${maxRetries}) exceeded. Last error: ${lastError!.message}`);
};

/**
 * Wraps a promise with both timeout and retry logic
 * @param fn The function to execute
 * @param timeoutMs Timeout for each attempt
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise that resolves with the result or rejects after max retries/timeout
 */
export const withTimeoutAndRetry = async <T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  maxRetries = 3
): Promise<T> => {
  return retryWithBackoff(
    () => withTimeout(fn(), timeoutMs, `Operation timed out after ${timeoutMs}ms`),
    maxRetries
  );
};
