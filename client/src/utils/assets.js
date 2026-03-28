const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/api\/?$/, "");

export const normalizeAssetPath = (assetPath) => {
  if (!assetPath || typeof assetPath !== "string") return "";

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  let normalized = assetPath.trim();

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  // Compatibilidad con rutas antiguas guardadas como /uploads/<file>
  if (normalized.startsWith("/uploads/")) {
    normalized = normalized.replace("/uploads/", "/public/");
  }

  return normalized;
};

export const buildAssetUrl = (assetPath) => {
  const normalized = normalizeAssetPath(assetPath);
  if (!normalized) return "";

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `${API_URL}${normalized}`;
};
