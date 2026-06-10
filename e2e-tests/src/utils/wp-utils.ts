import fs from "fs";
import path from "path";

export type PathResolution = {
  resolvedPath: string;
  triedPaths: string[];
};

export function toEnvKey(type: string): string {
  return type.replace(/[^a-z0-9]+/gi, "_").toUpperCase();
}

/**
 * File System & Path Resolution
 * Logic for finding assets across local and e2e roots.
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
