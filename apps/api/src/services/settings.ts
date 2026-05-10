import { Setting } from "../models/Setting.js";

export async function getSettings() {
  return Setting.findOneAndUpdate({ singleton: "app" }, { $setOnInsert: { singleton: "app" } }, { new: true, upsert: true });
}
