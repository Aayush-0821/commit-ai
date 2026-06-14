import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";

import { getRemoteUrl } from "../git/remote.js";
import { parseGithubUrl } from "../github/parser.js";
import { createBranch } from "../git/branch.js";
import { stageAll, commit, pushBranch } from "../git/actions.js";
import { getGitDiff } from "../git/diff.js";
import { analyzeDiff } from "../core/diffAnalyzer.js";
import { generateAICommitMessage } from "../ai/commitAI.js";
import { generatePRContent } from "../github/prGenerator.js";
import { createPullRequest } from "../github/pullRequest.js";
import { generateBranchName } from "../core/branchGenerator.js";
import { analyzeRepository } from "../core/statusAnalyzer.js";
import { getConfig } from "../config/configManager.js";

export async function runPRWorkflow() {
  console.log(chalk.cyan.bold("\n Commit-AI PR Assistant\n"));
  console.log(chalk.dim("─".repeat(40)));
  const config = getConfig();

  // 1. Pre-flight check for GitHub Token
  if (!config?.githubToken) {
    console.log(chalk.red("❌ Error: GITHUB_TOKEN is missing."));
    console.log(
      chalk.yellow("Run commit-ai init and add your GitHub token.\n"),
    );
    return;
  }

  // 2. Fetch changes
  const initSpinner = ora("Analyzing repository and remote...").start();
  let remote, owner, repo;
  try {
    remote = await getRemoteUrl();
    const parsed = parseGithubUrl(remote);
    owner = parsed.owner;
    repo = parsed.repo;
    initSpinner.succeed(`Target repository: ${chalk.bold(`${owner}/${repo}`)}`);
  } catch (error) {
    initSpinner.fail(chalk.red("Could not detect GitHub remote origin."));
    return;
  }

  const status = await analyzeRepository();
  const diff = await getGitDiff();
  const analysis = analyzeDiff(diff.combined);

  if (analysis.files.length === 0) {
    console.log(chalk.yellow("\n⚠️  No changes found to create a PR for.\n"));
    return;
  }

  let branch = status.branch;
  const isMainBranch = branch === "main" || branch === "master";

  if (!isMainBranch) {
    console.log(`\n You are currently on : ${chalk.cyan.bold(branch)}`);
    const reuseAnswer = await inquirer.prompt([
      {
        type: "confirm",
        name: "reuse",
        message:
          "Do you want to update this existing branch instead of making a new one?",
        default: true,
      },
    ]);

    if (!reuseAnswer.reuse) {
      branch = "";
    }
  } else {
    branch = "";
  }

  // 3. Generate AI Content FIRST (so we have the message for the branch name)
  const aiSpinner = ora("AI is analyzing changes and drafting PR...").start();
  let message = "chore: update changes";
  let pr = { title: "Update", body: "Automated PR created by Commit-AI" };

  try {
    message = (await generateAICommitMessage(diff.combined)) || message;
    pr = await generatePRContent(diff.combined);
    aiSpinner.succeed("PR Draft Generated!");
  } catch (error: any) {
    aiSpinner.fail(chalk.yellow("AI unavailable. Using default PR template."));
  }

  const suggestedBranch = generateBranchName(analysis, message);
  // 3. Ask for Branch Name
  // Branch Selection
  let finalBranchName = suggestedBranch;

  const branchChoice = await inquirer.prompt([
    {
      type: "select",
      name: "branchAction",
      message: `Suggested branch: ${chalk.cyan(suggestedBranch)}`,
      choices: [
        {
          name: "✔ Use this branch name",
          value: "use",
        },
        {
          name: "  Edit branch name",
          value: "edit",
        },
        {
          name: " Cancel PR creation",
          value: "cancel",
        },
      ],
    },
  ]);

  // Cancel
  if (branchChoice.branchAction === "cancel") {
    console.log(chalk.red("\nPR creation cancelled.\n"));

    return;
  }

  // Edit
  if (branchChoice.branchAction === "edit") {
    const editAnswer = await inquirer.prompt([
      {
        type: "input",
        name: "branchName",
        message: "Enter new branch name:",
        default: suggestedBranch,

        validate(value) {
          if (!value.trim()) {
            return "Branch name cannot be empty";
          }

          return true;
        },
      },
    ]);

    finalBranchName = editAnswer.branchName;
  }

  // Create branch
  const finalBranch = await createBranch(finalBranchName);

  console.log(chalk.green(`✔ Switched to new branch: ${finalBranch}\n`));

  // 5. Interactive Review Loop
  let isAccepted = false;
  while (!isAccepted) {
    console.log(`\n ${chalk.white.bold("Pull Request Draft:")}`);
    console.log(chalk.dim("─".repeat(40)));
    console.log(`${chalk.bold.magenta("Title:")} ${pr.title}`);
    console.log(`${chalk.bold.magenta("Body:")}\n${chalk.dim(pr.body)}`);
    console.log(chalk.dim("─".repeat(40)));

    const answer = await inquirer.prompt([
      {
        type: "select",
        name: "action",
        message: "How does this PR look?",
        choices: [
          { name: " Looks good, Ship It!", value: "proceed" },
          { name: "  Edit PR Title", value: "edit_title" },
          { name: "  Edit PR Body", value: "edit_body" },
          { name: " Cancel", value: "cancel" },
        ],
      },
    ]);

    if (answer.action === "cancel") {
      console.log(chalk.red("\nPR creation cancelled.\n"));
      return;
    }

    if (answer.action === "edit_title") {
      const edit = await inquirer.prompt([
        {
          type: "input",
          name: "title",
          message: "PR Title:",
          default: pr.title,
        },
      ]);
      pr.title = edit.title;
    }

    if (answer.action === "edit_body") {
      const edit = await inquirer.prompt([
        {
          type: "editor",
          name: "body",
          message: "Edit PR Body:",
          default: pr.body,
        },
      ]);
      pr.body = edit.body;
    }

    if (answer.action === "proceed") {
      isAccepted = true;
    }
  }

  // 6. Execute Git & GitHub Commands
  const gitSpinner = ora("Staging, committing, and pushing...").start();
  await stageAll();
  await commit(message);
  await pushBranch(finalBranch);
  gitSpinner.succeed("Code securely pushed to remote.");

  const prSpinner = ora("Opening Pull Request on GitHub...").start();
  try {
    const url = await createPullRequest(
      owner,
      repo,
      pr.title,
      pr.body,
      finalBranch,
    );
    prSpinner.succeed(chalk.green.bold("Pull Request Successfully Created!"));
    console.log(`\n ${chalk.cyan.underline(url)}\n`);
  } catch (error: any) {
    prSpinner.fail(chalk.red("Failed to create Pull Request."));
    console.error(chalk.dim(error.message));
  }
}
