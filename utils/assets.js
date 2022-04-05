import fs from "fs"
import path from "path"

const assetsDir = path.join(process.cwd(), "assets");

export function getAssetFile(filename) {
  return fs.readFileSync(path.join(assetsDir, filename), "utf8");
}