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

  // ---------------- Analyze Current Changes ----------------

  let diff = await getGitDiff();

  let analysis = analyzeDiff(diff.combined);

  if (analysis.files.length === 0) {
    console.log(chalk.yellow("No changes found for PR"));

    return;
  }

  // ---------------- AI Generation ----------------

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

  // ---------------- Commit Changes ----------------

  const commitAnswer = await inquirer.prompt([
    {
      type: "confirm",

      name: "commit",

      message: "Commit current changes automatically?",

      default: true,
    },
  ]);

  if (commitAnswer.commit) {
    const spinner = ora("Saving changes...").start();

    await stageAll();

    await commit(message);

    spinner.succeed("Changes committed");
  }

  // ---------------- Branch Selection ----------------

  let status = await analyzeRepository();

  let finalBranch = status.branch;

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

  if (branchAnswer.action === "cancel") return;

  // CURRENT

  if (branchAnswer.action === "current") {
    console.log(chalk.green(`✔ Using ${finalBranch}`));
  }

  // EXISTING

  if (branchAnswer.action === "existing") {
    const selected = await inquirer.prompt([
      {
        type: "select",

        name: "branch",

        message: "Select branch",

        choices: branches,
      },
    ]);

    finalBranch = await prepareBranchSwitch(selected.branch);
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

  // ---------------- Refresh Diff ----------------

  diff = await getGitDiff();

  analysis = analyzeDiff(diff.combined);

  // ---------------- Review ----------------

  let accepted = false;

  while (!accepted) {
    console.log(`\n${chalk.bold("PR Preview")}`);

    console.log(chalk.dim("─".repeat(40)));

    console.log(`${chalk.magenta("Title:")} ${pr.title}`);

    console.log(`${chalk.magenta("Body:")}\n${pr.body}`);

    const answer = await inquirer.prompt([
      {
        type: "select",

        name: "action",

        message: "Continue?",

        choices: [
          {
            name: "✔ Ship PR",
            value: "yes",
          },

          {
            name: "Edit title",
            value: "title",
          },

          {
            name: "Edit body",
            value: "body",
          },

          {
            name: "Cancel",
            value: "cancel",
          },
        ],
      },
    ]);

    if (answer.action === "cancel") return;

    if (answer.action === "title") {
      const edit = await inquirer.prompt([
        {
          type: "input",

          name: "value",

          message: "Title",

          default: pr.title,
        },
      ]);

      pr.title = edit.value;
    }

    if (answer.action === "body") {
      const edit = await inquirer.prompt([
        {
          type: "editor",

          name: "value",

          message: "Body",

          default: pr.body,
        },
      ]);

      pr.body = edit.value;
    }

    if (answer.action === "yes") accepted = true;
  }

  // ---------------- Push ----------------

  const pushSpinner = ora("Pushing changes...").start();

  await pushBranch(finalBranch);

  pushSpinner.succeed("Code pushed");

  // ---------------- Create PR ----------------

  const prSpinner = ora("Creating GitHub PR...").start();

  try {
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
