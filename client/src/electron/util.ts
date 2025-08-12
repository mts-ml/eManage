import { app } from "electron"
import path from "path"


export function isDev() {
  return process.env.NODE_ENV === "development";
}


export function getAssetPath() {
  return path.join(app.getAppPath(), isDev() ? '.' : '..', '/public/assets/images')
}
