import fs from "fs";
import path from "path";

/**
 * Types shared across the WordPress service suite
 */
export type WpResult = {
  exitCode: number;
  stdout: string;
  stderr?: string;
};

export type PathResolution = {
  resolvedPath: string;
  triedPaths: string[];
};

/**
 * Environment & Service Helpers
 */
export function isParallelLocal(): boolean {
  return process.env.PARALLEL_LOCAL === "true";
}

export function isInitService(serviceName: string): boolean {
  return /^init\d+$/.test(serviceName);
}

export function isParallelWordpressService(serviceName: string): boolean {
  return /^wordpress\d+$/.test(serviceName);
}

export function toEnvKey(type: string): string {
  return type.replace(/[^a-z0-9]+/gi, "_").toUpperCase();
}

/**
 * Error Formatting
 */
export function formatWpCliFailure(message: string, result: WpResult): Error {
  const details = (result.stderr || result.stdout || "").trim();
  return new Error(message + (details ? `\n\nWP-CLI output:\n${details}` : ""));
}

/**
 * File System & Path Resolution
 * Logic for finding assets across local, e2e, and docker roots.
 */
export function resolveLocalPath(inputPath: string): PathResolution {
  if (path.isAbsolute(inputPath)) {
    return { resolvedPath: inputPath, triedPaths: [inputPath] };
  }

  const triedPaths: string[] = [];

  function tryPath(candidate: string): string | undefined {
    triedPaths.push(candidate);
    return fs.existsSync(candidate) ? candidate : undefined;
  }

  // 1. Try Assets Root
  const assetsRoot = (process.env.WP_ASSETS_CWD || "").trim();
  if (assetsRoot) {
    const found = tryPath(path.resolve(assetsRoot, inputPath));
    if (found) return { resolvedPath: found, triedPaths };
  }

  const e2eTestsRoot = path.resolve(__dirname, "../../");

  // 2. Try E2E Assets Folder
  const foundFromAssets = tryPath(
    path.resolve(e2eTestsRoot, "assets", inputPath),
  );
  if (foundFromAssets) return { resolvedPath: foundFromAssets, triedPaths };

  // 3. Try E2E Root
  const foundFromE2eRoot = tryPath(path.resolve(e2eTestsRoot, inputPath));
  if (foundFromE2eRoot) return { resolvedPath: foundFromE2eRoot, triedPaths };

  // 4. Try CWD
  const foundFromCwd = tryPath(path.resolve(process.cwd(), inputPath));
  if (foundFromCwd) return { resolvedPath: foundFromCwd, triedPaths };

  // 5. Try Docker Repo Root
  const wordpressRepo = (process.env.WP_DOCKER_CWD || "").trim();
  if (wordpressRepo) {
    const foundFromWpRepo = tryPath(path.resolve(wordpressRepo, inputPath));
    if (foundFromWpRepo) return { resolvedPath: foundFromWpRepo, triedPaths };
  }

  // Fallback
  return { resolvedPath: path.resolve(e2eTestsRoot, inputPath), triedPaths };
}

/**
 * Mime Type Guessing
 */
export function guessMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
