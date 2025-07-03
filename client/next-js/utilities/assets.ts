import { ASSET_BASE_URL } from "@/consts";

export function assetUrl(path: string): string {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  return `${ASSET_BASE_URL}${path}`;
}
