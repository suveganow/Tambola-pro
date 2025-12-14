import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: any): string {
  // If it's a string, return it directly
  if (typeof error === 'string') return error;

  // Handle Axios errors or similar objects with response data
  if (error?.response?.data) {
    const data = error.response.data;

    // Direct string error from server
    if (typeof data === 'string') return data;

    // Check for "error" property
    if (data.error) {
      if (typeof data.error === 'string') return data.error;
      // Handle array of errors (like Zod issues)
      if (Array.isArray(data.error)) {
        return data.error
          .map((e: any) => e.message || e.path?.join('.') || 'Validation error')
          .join(', ');
      }
      // Handle object with message
      if (data.error.message) return data.error.message;
    }

    // Check for "message" property
    if (data.message) return data.message;

    // Check for "details" (sometimes used for validation errors)
    if (data.details) {
      if (Array.isArray(data.details)) {
        return data.details.map((d: any) => `${d.path?.join('.') || d.field || 'Field'}: ${d.message}`).join(', ');
      }
      if (typeof data.details === 'string') return data.details;
    }
  }

  // Handle Axios Errors without response (Network errors etc)
  if (error?.message) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}
