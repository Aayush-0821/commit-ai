import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";

import { analyzeRepository } from "../core/statusAnalyzer.js";
import { getGitDiff,getRecentCommits } from "../git/diff.js";
import { analyzeDiff } from "../core/diffAnalyzer.js";
import { generateAICommitMessage } from "../ai/commitAI.js";
import { generateCommitMessage } from "../core/commitGenerator.js";

import { stageAll, commit, pushBranch } from "../git/actions.js";

import { setPushPermissions, canPush } from "./session.js";

export async function runCommitWorkflow() {
  console.log(chalk.cyan.bold("\n Commit-AI Auto Commit\n"));

  const analyzeSpinner = ora("Analyzing Repository Status...").start();
  const status = await analyzeRepository();

  if (status.clean) {
    analyzeSpinner.info(chalk.yellow(chalk.green("No changes detected,Working Tree is clean.")));

    return;
  }
  analyzeSpinner.succeed("Repository Analyzed.");

  const diffSpinner = ora("Reading diff and commit history...").start();
  const diffData = await getGitDiff();

  const analysis = analyzeDiff(diffData.combined);
  const pastCommits = await getRecentCommits(10);
  diffSpinner.succeed("Changes and history loaded.\n");

  let message = "";
  let isMessageAccepted = false;

  while (!isMessageAccepted) {
    const aiSpinner = ora("AI is writing your commit message...").start();
    try {
      message = await generateAICommitMessage(diffData.combined,pastCommits) || "";
      aiSpinner.succeed("Message Generated !");
    } catch (error: any) {
        aiSpinner.fail(chalk.yellow("AI unavaliable. Using local generator fallback."));
      message = generateCommitMessage(analysis);
    }
    console.log(`\n ${chalk.white.bold("Suggested Commit : ")}`);
    console.log(`   ${chalk.green.bold(message)}\n`);
  // Interactive choices
    const answer = await inquirer.prompt([
      {
        type: "select",
        name: "action",
        message: "How would you like to proceed?",
        choices: [
          { name: "Accept and Commit", value: "commit" },
          { name: "Edit Message manually", value: "edit" },
          { name: "Regenerate with AI", value: "regenerate" },
          { name: "Cancel", value: "cancel" }
        ]
      }
    ]);

    if (answer.action === "cancel") {
      console.log(chalk.red("\nCommit cancelled by user.\n"));
      return;
    }

    if (answer.action === "regenerate") {
      const regenSpinner = ora("Discarding Previous Message...").start();

      await new Promise(resolve => setTimeout(resolve,600));

      regenSpinner.stopAndPersist({
        text:chalk.dim("Retrying AI Generation...\n")
      });
      
      continue;
    }

    if (answer.action === "edit") {
      const editAnswer = await inquirer.prompt([
        {
          type: "input",
          name: "editedMessage",
          message: "Modify your commit message:",
          default: message 
        }
      ]);
      message = editAnswer.editedMessage;
      isMessageAccepted = true; 
    }

    if (answer.action === "commit") {
      isMessageAccepted = true; 
    }
  }

  // 4. Executing Git Commands with Spinners
  const gitSpinner = ora("Staging all files and committing...").start();
  await stageAll();
  await commit(message);
  gitSpinner.succeed(chalk.green("Changes committed successfully!"));

  // 5. Push Logic
  if (canPush()) {
    const pushSpinner = ora("Pushing to remote...").start();
    await pushBranch(status.branch);
    pushSpinner.succeed(chalk.green("Pushed to remote successfully!\n"));
    return;
  }

  const pushAnswer = await inquirer.prompt([
    {
      type: "confirm",
      name: "push",
      message: "Do you want to push these changes to remote?",
      default: true
    }
  ]);

  if (pushAnswer.push) {
    setPushPermissions(true);
    const pushSpinner = ora("Pushing to remote...").start();
    await pushBranch(status.branch);
    pushSpinner.succeed(chalk.green("Pushed to remote successfully!\n"));
  } else {
    console.log(chalk.dim("Changes remain locally committed.\n"));
  }
}