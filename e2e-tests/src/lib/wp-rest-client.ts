import fs from "fs";
import path from "path";
import { toEnvKey, guessMimeType } from "../utils/wp-utils";

export type RestConfig = {
  baseUrl: string;
  username: string;
  password: string;
};

/**
 * Validates and retrieves REST credentials from environment variables.
 */
export function getRestConfig(): RestConfig {
  const baseUrl = (
    process.env.WP_REMOTE_BASE_URL ||
    process.env.PW_BASE_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");

  if (!baseUrl) {
    throw new Error(
      "Remote WP driver selected but base URL missing. Set WP_REMOTE_BASE_URL.",
    );
  }

  const username = (
    process.env.WP_API_USER ||
    process.env.WP_QA_ADMIN_USER ||
    process.env.WP_ADMIN_USER ||
    process.env.WP_USER ||
    ""
  ).trim();

  const password = (
    process.env.WP_API_PASSWORD ||
    process.env.WP_QA_ADMIN_PASSWORD ||
    process.env.WP_ADMIN_APP_PASSWORD ||
    process.env.WP_ADMIN_PASSWORD ||
    ""
  ).trim();

  if (!username || !password) {
    throw new Error(
      "Remote WP driver selected but username or password missing.",
    );
  }

  return { baseUrl, username, password };
}

/**
 * Generates the Basic Auth header string.
 */
export function basicAuthHeader(restConfig: RestConfig): string {
  const token = Buffer.from(
    `${restConfig.username}:${restConfig.password}`,
  ).toString("base64");
  return `Basic ${token}`;
}

/**
 * Generic wrapper for WordPress REST API calls.
 */
export async function wpRest<ResponseType>(
  restConfig: RestConfig,
  method: "GET" | "POST" | "DELETE",
  urlPath: string,
  body?: any,
): Promise<ResponseType> {
  const url = `${restConfig.baseUrl}${urlPath.startsWith("/") ? "" : "/"}${urlPath}`;
  const authHeader = basicAuthHeader(restConfig);

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("---- WP REST FAILURE ----", {
      url,
      method,
      status: response.status,
      body: text,
    });
    throw new Error(
      `WP REST ${method} ${url} failed (${response.status})\n${text}`,
    );
  }

  return text
    ? (JSON.parse(text) as ResponseType)
    : (undefined as ResponseType);
}

/**
 * Uploads a file to the WordPress Media Library via REST.
 */
export async function uploadMedia(
  restConfig: RestConfig,
  localFilePath: string,
): Promise<number> {
  const fileName = path.basename(localFilePath);
  const bytes = await fs.promises.readFile(localFilePath);
  const mime = guessMimeType(localFilePath);

  const url = `${restConfig.baseUrl}/wp-json/wp/v2/media`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(restConfig),
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": mime,
      Accept: "application/json",
    },
    body: bytes,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WP Media Upload failed (${response.status})\n${text}`);
  }

  const json = await response.json();
  return Number(json?.id);
}

/**
 * Maps post types to REST endpoints, allowing environment overrides.
 */
export function restEndpointForType(type: string): string {
  if (type === "post") return "posts";
  if (type === "page") return "pages";

  const envKey = `WP_REST_ENDPOINT_${toEnvKey(type)}`;
  const override = (process.env[envKey] || "").trim();
  return override || type;
}
