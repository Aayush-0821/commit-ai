import { Octokit } from "octokit";
import { getConfig } from "../config/configManager.js";

export function getGithubClient() {
  const config = getConfig();

  if (!config) {
    throw new Error("Commit-AI not configured");
  }

  return new Octokit({
    auth: config.githubToken,
  });
}
