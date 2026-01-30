/**
 * Fetch utility for Edge Runtime compatibility
 * Handles SSL certificate issues without using Node.js modules
 */

interface EdgeFetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Enhanced fetch function that works in Edge Runtime
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with fetch response
 */
export async function edgeFetch(url: string, options: EdgeFetchOptions = {}): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });

  // For development, we can add custom headers or handling
  const enhancedOptions: RequestInit = {
    ...fetchOptions,
    headers: {
      'User-Agent': 'EMI-Portal/1.0',
      ...fetchOptions.headers,
    },
  };

  try {
    // Race between fetch and timeout
    const response = await Promise.race([
      fetch(url, enhancedOptions),
      timeoutPromise
    ]);

    return response;
  } catch (error) {
    // Enhanced error handling for development
    if (process.env.NODE_ENV === 'development') {
      console.error('[EdgeFetch] Request failed:', {
        url,
        error: error instanceof Error ? error.message : String(error),
        options: enhancedOptions
      });
    }
    throw error;
  }
}

/**
 * JSON fetch utility with automatic parsing
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with parsed JSON response
 */
export async function edgeFetchJson<T = any>(
  url: string, 
  options: EdgeFetchOptions = {}
): Promise<{ data: T; response: Response }> {
  const response = await edgeFetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Expected JSON response but got ${contentType}`);
  }

  const data = await response.json();
  return { data, response };
}

/**
 * POST request utility for Edge Runtime
 * @param url - The URL to post to
 * @param body - Request body
 * @param options - Additional fetch options
 * @returns Promise with fetch response
 */
export async function edgePost(
  url: string,
  body: any,
  options: Omit<EdgeFetchOptions, 'body' | 'method'> = {}
): Promise<Response> {
  return edgeFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...options,
  });
}

export default edgeFetch;
