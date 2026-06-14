import inquirer from "inquirer";
import chalk from "chalk";

import { saveConfig } from "../config/configManager.js";

export async function initCommand() {
  console.log(chalk.cyan.bold("\n Commit-AI Setup\n"));

  const answers = await inquirer.prompt([
    {
      type: "select",
      name: "provider",
      message: "Select AI Provider",
      choices: ["openrouter", "openai", "gemini"],
    },
    {
      type: "password",
      name: "apikey",
      message: "Enter API Key",
    },
    {
      type: "password",
      name: "githubToken",
      message: "Enter Github Token",
    },
  ]);

  saveConfig({
    provider: answers.provider,
    apiKey: answers.apikey,
    githubToken: answers.githubToken,
  });

  console.log(chalk.green("\n Configuration Saved"));
}
