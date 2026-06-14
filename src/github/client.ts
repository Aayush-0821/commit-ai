import { Octokit } from "octokit";
import { getConfig } from "../config/configManager.js";

const config = getConfig();

export const github = new Octokit({
    auth:config?.githubToken
});