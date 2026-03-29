/**
 * Centralized API client for communicating with the FastAPI backend.
 * All API calls should go through this module to ensure consistent
 * error handling, authentication headers, and request formatting.
 */

/**
 * API base URL — routes through the Next.js API proxy layer
 * to keep the backend URL server-side only.
 */
const API_BASE_URL = "/api/pdf";

/** Standard API error returned by the backend */
interface ApiError {
  detail: string;
  status: number;
}

/** Custom error class for API failures with structured error data */
export class ApiRequestError extends Error {
  public status: number;
  public detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiRequestError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Makes a typed request to the DocuConversion API.
 * Automatically handles JSON parsing, error responses, and base URL resolution.
 *
 * @param endpoint - API path (e.g., "/convert/pdf-to-word")
 * @param options - Standard fetch options (method, body, headers, etc.)
 * @returns Parsed JSON response typed as T
 * @throws ApiRequestError if the response status is not ok
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail = "An unexpected error occurred";
    try {
      const errorBody: ApiError = await response.json();
      detail = errorBody.detail;
    } catch {
      detail = response.statusText;
    }
    throw new ApiRequestError(response.status, detail);
  }

  return response.json() as Promise<T>;
}

/**
 * Uploads a file to the backend for processing.
 * Uses multipart/form-data encoding for file transfer.
 *
 * @param endpoint - API path for the upload (e.g., "/convert/pdf-to-word")
 * @param file - The file to upload
 * @param additionalData - Optional extra form fields to include
 * @returns Parsed JSON response typed as T
 */
export async function uploadFile<T>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = "File upload failed";
    try {
      const errorBody: ApiError = await response.json();
      detail = errorBody.detail;
    } catch {
      detail = response.statusText;
    }
    throw new ApiRequestError(response.status, detail);
  }

  return response.json() as Promise<T>;
}
