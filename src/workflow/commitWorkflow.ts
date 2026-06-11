import chalk from "chalk";
import inquirer from "inquirer";

import { analyzeRepository } from "../core/statusAnalyzer.js";
import { getGitDiff } from "../git/diff.js";
import { analyzeDiff } from "../core/diffAnalyzer.js";
import { generateAICommitMessage } from "../ai/commitAI.js";
import { generateCommitMessage } from "../core/commitGenerator.js";

import { stageAll, commit, push } from "../git/actions.js";

import { setPushPermissions, canPush } from "./session.js";

export async function runCommitWorkflow() {
  console.log(chalk.cyan.bold("\n Commit-AI Auto Commit\n"));

  const status = await analyzeRepository();

  if (status.clean) {
    console.log(chalk.green("No changes detected."));

    return;
  }

  const diffData = await getGitDiff();

  const analysis = analyzeDiff(diffData.combined);

  let message;

  try {
    message = await generateAICommitMessage(diffData.combined);
  } catch (error: any) {
    message = generateCommitMessage(analysis);
  }

  console.log(
    `
    Suggested Commit : 
    ${chalk.green.bold(message)}
    `,
  );

  const answer = await inquirer.prompt([
    {
      type: "confirm",
      name: "commit",
      message: "Commit these changes?",
    },
  ]);

  if(!answer.commit){
    console.log("Cancelled.");

    return;
  }

  await stageAll();

  await commit(message);

  console.log(chalk.green("Committed Successfully !"));

  if(canPush()){
    await push();

    console.log(chalk.green("Pushed!"));

    return;
  }

  const pushAnswer = await inquirer.prompt([
    {
        type:"confirm",
        name:"push",
        message:"Push to Remote?"
    }
  ]);

  if(pushAnswer.push){
    setPushPermissions(true);

    await push();

    console.log(chalk.green("Pushed !"));
  }
}
