import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";

import { getRemoteUrl } from "../git/remote.js";
import { parseGithubUrl } from "../github/parser.js";

import { createBranch, getBranches } from "../git/branch.js";
import { stageAll, commit, pushBranch } from "../git/actions.js";
import { getGitDiff } from "../git/diff.js";

import { analyzeDiff } from "../core/diffAnalyzer.js";
import { generateAICommitMessage } from "../ai/commitAI.js";
import { generatePRContent } from "../github/prGenerator.js";

import { createPullRequest } from "../github/pullRequest.js";

import { generateBranchName } from "../core/branchGenerator.js";
import { analyzeRepository } from "../core/statusAnalyzer.js";
import { getConfig } from "../config/configManager.js";
import { prepareBranchSwitch } from "./branchManager.js";

export async function runPRWorkflow() {
  console.log(chalk.cyan.bold("\n Commit-AI PR Assistant\n"));
  console.log(chalk.dim("─".repeat(40)));

  const config = getConfig();

  if (!config?.githubToken) {
    console.log(chalk.red("❌ GitHub token missing"));
    console.log(chalk.yellow("Run commit-ai init first\n"));
    return;
  }

  // ---------------- Repository ----------------

  let owner = "";
  let repo = "";

  try {
    const remote = await getRemoteUrl();

    const parsed = parseGithubUrl(remote);

    owner = parsed.owner;
    repo = parsed.repo;

    console.log(chalk.green(`✔ Repository: ${owner}/${repo}`));
  } catch {
    console.log(chalk.red("❌ Cannot detect GitHub repository"));

    return;
  }

  // ---------------- Read Changes ----------------

  let diff = await getGitDiff();

  let analysis = analyzeDiff(diff.combined);

  if (analysis.files.length === 0) {
    console.log(chalk.yellow("No changes found for PR"));

    return;
  }

  // ---------------- AI ----------------

  const aiSpinner = ora("AI analyzing changes...").start();

  let message = "chore: update changes";

  let pr = {
    title: "Update changes",
    body: "Created using Commit-AI",
  };

  try {
    message = (await generateAICommitMessage(diff.combined)) || message;

    pr = await generatePRContent(diff.combined);

    aiSpinner.succeed("AI draft generated");
  } catch {
    aiSpinner.warn("AI unavailable. Using fallback");
  }

  console.log(
    "\n" + chalk.yellow("Generated Commit:") + " " + chalk.white.bold(message),
  );

  // ---------------- Branch Selection ----------------

  let status = await analyzeRepository();

  let finalBranch = status.branch;

  if (status.branch === "HEAD") {
    console.log(chalk.yellow("\n⚠️ You are currently not on a branch."));

    const fix = await inquirer.prompt([
      {
        type: "input",
        name: "branch",
        message: "Create/Switch to branch : ",
        default: "feature/commit-ai",
      },
    ]);

    finalBranch = await createBranch(fix.branch);

    console.log(chalk.green(`✔ Switched to ${finalBranch}`));
  }

  const branches = await getBranches();

  const branchAnswer = await inquirer.prompt([
    {
      type: "select",
      name: "action",
      message: "Where should PR be created?",

      choices: [
        {
          name: `Current branch (${status.branch})`,
          value: "current",
        },

        {
          name: "Existing branch",
          value: "existing",
        },

        {
          name: "New branch",
          value: "new",
        },

        {
          name: "Cancel",
          value: "cancel",
        },
      ],
    },
  ]);

  if (branchAnswer.action === "cancel") {
    console.log(chalk.yellow("Cancelled. No changes made."));

    return;
  }

  // CURRENT BRANCH

  if (branchAnswer.action === "current") {
    console.log(chalk.green(`✔ Using ${finalBranch}`));
  }

  // EXISTING BRANCH

  if (branchAnswer.action === "existing") {
    const selected = await inquirer.prompt([
      {
        type: "select",
        name: "branch",
        message: "Select branch",

        choices: branches,
      },
    ]);

    const spinner = ora("Moving changes safely...").start();

    try {
      finalBranch = await prepareBranchSwitch(selected.branch);

      spinner.succeed(`Switched to ${finalBranch}`);
    } catch (error: any) {
      spinner.fail("Could not switch branch");

      console.log(chalk.red(error.message));

      return;
    }
  }

  // NEW BRANCH

  if (branchAnswer.action === "new") {
    const suggested = generateBranchName(analysis, message);

    const choice = await inquirer.prompt([
      {
        type: "select",
        name: "branch",

        message: `Suggested branch ${suggested}`,

        choices: [
          {
            name: "✔ Use suggested",
            value: "use",
          },

          {
            name: "Edit name",
            value: "edit",
          },

          {
            name: "Cancel",
            value: "cancel",
          },
        ],
      },
    ]);

    if (choice.branch === "cancel") return;

    let branchName = suggested;

    if (choice.branch === "edit") {
      const edited = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Branch name",
          default: suggested,
        },
      ]);

      branchName = edited.name;
    }

    finalBranch = await createBranch(branchName);

    console.log(chalk.green(`✔ Created ${finalBranch}`));
  }

  // ---------------- Preview ----------------

  console.log("\n" + chalk.bold("PR Preview"));

  console.log(chalk.dim("─".repeat(40)));

  console.log(`${chalk.yellow("Commit:")} ${message}`);

  console.log(`${chalk.magenta("Title:")} ${pr.title}`);

  console.log(`${chalk.magenta("Body:")}\n${pr.body}`);

  const confirm = await inquirer.prompt([
    {
      type: "confirm",

      name: "ship",

      message: "Ship this PR?",

      default: true,
    },
  ]);

  if (!confirm.ship) {
    console.log(chalk.yellow("Cancelled. No git changes made."));

    return;
  }

  // ---------------- PR ----------------

  const prSpinner = ora("Creating GitHub PR...").start();

  try {
    // Prevent creating PR from main -> main
    const baseBranch = "main";

    if (finalBranch === baseBranch) {
      console.log(chalk.yellow("\n⚠️ PR cannot be created from main to main"));

      const answer = await inquirer.prompt([
        {
          type: "confirm",
          name: "createBranch",
          message: "Create feature branch automatically?",
          default: true,
        },
      ]);

      if (!answer.createBranch) {
        console.log(chalk.red("PR cancelled"));
        return;
      }

      const branchName = generateBranchName(analysis, message);

      finalBranch = await createBranch(branchName);

      console.log(chalk.green(`✔ Created ${finalBranch}`));
    }

    // ALWAYS COMMIT
    const gitSpinner = ora("Committing changes...").start();

    await stageAll();

    await commit(message);

    gitSpinner.succeed("Changes committed");

    // ALWAYS PUSH
    const pushSpinner = ora("Pushing changes...").start();

    await pushBranch(finalBranch);

    pushSpinner.succeed("Code pushed");

    const url = await createPullRequest(
      owner,
      repo,
      pr.title,
      pr.body,
      finalBranch,
    );
    prSpinner.succeed("Pull Request Created!");

    console.log(chalk.cyan.underline(url));
  } catch (error: any) {
    prSpinner.fail("Failed creating PR");

    console.log(chalk.red(error.message));
  }
}
