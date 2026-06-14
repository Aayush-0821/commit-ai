import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".commit-ai");

const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function getConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return null;
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));

  return {
    ...config,

    preferences: {
      autoCommit: false,
      autoPush: false,

      confirmBeforeCommit: true,
      confirmBeforePush: true,

      branchStrategy: "ai",
      commitStyle: "conventional",

      maxDiffSize: 500,

      ...(config.preferences || {}),
    },
  };
}

export function saveConfig(config: any) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, {
      recursive: true,
    });
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
