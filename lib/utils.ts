import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(decimals)} ${sizes[i]}`;
}

export const HTTP_STATUS_MESSAGES: Record<number, string> = {
  // ✅ Success
  200: "200 - OK — Request succeeded.",
  201: "201 - Created — Resource was successfully created.",
  202: "202 -Accepted — Request received, processing pending.",
  204: "204 - No Content — Request succeeded but returned no data.",

  // ⚠️ Redirects
  301: "301 - Moved Permanently — Resource has a new URL.",
  302: "302 - Found — Temporary redirect.",
  304: "304 - Not Modified — Cached version may be used.",

  // ❌ Client Errors
  400: "400 - Bad Request — The server couldn’t understand the request.",
  401: "401 - Unauthorized — Authentication is required.",
  403: "403 - Forbidden — You don’t have permission to access this.",
  404: "404 - Not Found — The requested resource does not exist.",
  405: "405 - Method Not Allowed — HTTP method not supported.",
  408: "408 - Request Timeout — The server timed out waiting.",
  409: "409 - Conflict — Request conflicts with current server state.",
  410: "410 - Gone — Resource has been permanently removed.",
  429: "429 - Too Many Requests — Rate limit exceeded.",

  // ❌ Server Errors
  500: "500 - Internal Server Error — Something went wrong on the server.",
  502: "502 - Bad Gateway — Invalid response from upstream server.",
  503: "503 - Service Unavailable — Server temporarily overloaded or down.",
  504: "504 - Gateway Timeout — Upstream server did not respond in time.",
};

export function getHttpStatusMessage(status?: number): string {
  if (!status) return "Unknown — No status code returned.";

  return (
    HTTP_STATUS_MESSAGES[status] ??
    `Unexpected Status (${status}) — Unknown response.`
  );
}