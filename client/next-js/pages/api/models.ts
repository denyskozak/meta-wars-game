import type { NextApiRequest, NextApiResponse } from "next";

import fs from "fs";
import path from "path";

const MODELS_DIR = path.join(process.cwd(), "public", "models");

function collect(dir: string, base = ""): string[] {
  return fs.readdirSync(dir).flatMap((item) => {
    const p = path.join(dir, item);
    const rel = path.join(base, item);

    if (fs.statSync(p).isDirectory()) {
      return collect(p, rel);
    }
    if (item.endsWith(".glb") || item.endsWith(".fbx")) {
      return [rel.replace(/\\/g, "/")];
    }

    return [];
  });
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const models = collect(MODELS_DIR);

  res.status(200).json({ models });
}
