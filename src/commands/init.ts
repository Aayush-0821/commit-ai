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

  const preferences = await inquirer.prompt([
    {
      type: "confirm",
      name: "autoCommit",
      message: "Automatically commit changes?",
      default: false,
    },

    {
      type: "confirm",
      name: "autoPush",
      message: "Automatically push changes?",
      default: false,
    },

    {
      type: "confirm",
      name: "confirmBeforeCommit",
      message: "Ask before committing?",
      default: true,
    },

    {
      type: "confirm",
      name: "confirmBeforePush",
      message: "Ask before pushing?",
      default: true,
    },

    {
      type: "select",
      name: "branchStrategy",
      message: "Branch naming strategy",

      choices: [
        {
          name: "AI generated",
          value: "ai",
        },
        {
          name: "Manual",
          value: "manual",
        },
      ],
    },
    {
      type: "select",
      name: "commitStyle",
      message: "Commit Message Style",
      choices: [
        {
          name: "Conventional commits (feat:, fix:, chore:)",
          value: "conventional",
        },
        {
          name: "Simple messages",
          value: "simple",
        },
      ],

      default: "conventional",
    },

    {
      type: "number",
      name: "maxDiffSize",
      message: "Maximum diff size for AI analysis",

      default: 500,
    },
  ]);

  saveConfig({
    provider: answers.provider,
    apiKey: answers.apikey,
    githubToken: answers.githubToken,
    preferences,
  });

  console.log(chalk.green("\n Configuration Saved"));
}
