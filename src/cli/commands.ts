import { Command } from "commander";
import chalk from "chalk";
import { analyzeRepository } from "../core/statusAnalyzer.js";
import path from "path";
import { calculateReadiness } from "../core/readiness.js";
import { getGitDiff, getRecentCommits } from "../git/diff.js";
import { analyzeDiff } from "../core/diffAnalyzer.js";
import { generateAICommitMessage } from "../ai/commitAI.js";
import { generateCommitMessage } from "../core/commitGenerator.js";
import ora from "ora";
import { runCommitWorkflow } from "../workflow/commitWorkflow.js";
import { runPRWorkflow } from "../workflow/prWorkflow.js";

function formatFilePath(fullPath: string): string {
  const fileName = path.basename(fullPath);
  const dirName = path.dirname(fullPath);

  if (dirName === ".") {
    return fileName;
  }

  return `${fileName} ${chalk.dim(`(${dirName}/)`)}`;
}

function renderProgressBar(score: number, width: number = 25): string {
  const filledLength = Math.round((score / 100) * width);
  const emptyLength = width - filledLength;

  const filledBar = "█".repeat(filledLength);
  const emptyBar = "░".repeat(emptyLength);

  return chalk.white.bold(`${filledBar}${emptyBar}`);
}

export function registerCommands(program: Command) {
  program
    .command("status")
    .description("Analyze repository status")
    .action(async () => {
      try {
        const result = await analyzeRepository();

        console.log(chalk.cyan.bold("\nCommit-AI Repository Analysis\n"));
        console.log(chalk.dim("-".repeat(40)));

        const branchStr = chalk.bold.magenta(`⌥ ${result.branch}`);
        const statusStr = result.clean
          ? chalk.green("✔ Working directory clean")
          : chalk.yellow("⚠️   Uncommitted changes present");

        console.log(`${branchStr}  |  ${statusStr}\n`);

        if (result.clean && !result.files.untracked.length) {
          console.log(chalk.green(" Nothing to commit, working tree clean.\n"));
          return;
        }

        console.log(chalk.white.bold("\nTracked Changes:"));

        if (result.files.staged.length) {
          console.log(`  ${chalk.green.bold(" Staged to be committed:")}`);
          result.files.staged.forEach((file) => {
            console.log(`    ${chalk.green("+")} ${formatFilePath(file)}`);
          });
        }

        if (result.files.modified.length) {
          console.log(`  ${chalk.yellow.bold(" Modified locally:")}`);
          result.files.modified.forEach((file) => {
            console.log(`    ${chalk.yellow("~")} ${formatFilePath(file)}`);
          });
        }

        if (result.files.deleted.length) {
          console.log(`  ${chalk.red.bold(" Deleted:")}`);
          result.files.deleted.forEach((file) => {
            console.log(`    ${chalk.red("-")} ${formatFilePath(file)}`);
          });
        }

        if (result.files.renamed.length) {
          console.log(`  ${chalk.blue.bold(" Renamed:")}`);
          result.files.renamed.forEach((file) => {
            console.log(`    ${chalk.blue("→")} ${formatFilePath(file)}`);
          });
        }

        // 4. Untracked Changes Section
        if (result.files.untracked.length) {
          console.log(`\n${chalk.bold.white(" Untracked Files:")}`);
          console.log(
            chalk.dim(
              "  (Use 'git add <file>...' to include in what will be committed)",
            ),
          );

          result.files.untracked.forEach((file) => {
            console.log(`    ${chalk.red("?")} ${formatFilePath(file)}`);
          });
        }

        // 5. Optional Ignored Files Section
        if (result.files.ignored?.length) {
          console.log(`\n${chalk.bold.dim(" Ignored Files:")}`);
          result.files.ignored.forEach((file) => {
            console.log(`    ${chalk.dim("◌")} ${formatFilePath(file)}`);
          });
        }

        console.log("");

        const readiness = calculateReadiness(result);

        // Pick a matching dynamic color for the text score percentage
        let scoreColor = chalk.red.bold;
        if (readiness.score >= 80) scoreColor = chalk.green.bold;
        else if (readiness.score >= 50) scoreColor = chalk.yellow.bold;

        console.log(chalk.dim("─".repeat(40)));
        console.log(
          `${chalk.white.bold(" Commit Readiness:")}  ${scoreColor(`${readiness.score}%\n`)}`,
        );
        console.log(`  ${renderProgressBar(readiness.score, 30)}\n`);

        if (readiness.warnings.length) {
          console.log(chalk.bold.white("⚠️  Warnings to Address:"));
          readiness.warnings.forEach((w) => {
            console.log(`  ${chalk.yellow("•")} ${chalk.yellow(w)}`);
          });
          console.log("");
        } else {
          console.log(
            `  ${chalk.green.bold("✔ Complete green flag! Ready to confidently commit.")}\n`,
          );
        }
      } catch (error: any) {
        if (error instanceof Error && error.message === "NO_GIT_REPOSITORY") {
          console.log(
            chalk.red(`
❌ No Git repository found.
Run ${chalk.bold.white("git init")} inside your project root to initialize one.
            `),
          );
          return;
        }

        console.error(`\n${chalk.red.bold("Internal Error:")}`, error);
      }
    });

  //---------------Diff Command-------------------
  program
    .command("diff")
    .description("Analyze UnCommitted Changes")
    .action(async () => {
      try {
        const diffData = await getGitDiff();

        const analysis = analyzeDiff(diffData.combined);

        console.log(
          chalk.cyan.bold(`
    Commit-AI Diff Analysis
    `),
        );
        console.log(chalk.dim("─".repeat(40)));

        const adds = chalk.green(`+${analysis.additions}`);
        const dels = chalk.red(`-${analysis.deletions}`);
        const totalChanges = analysis.additions + analysis.deletions;

        let impactColor = chalk.green;

        if (analysis.impact === "MEDIUM") impactColor = chalk.yellow;
        if (analysis.impact === "HIGH") impactColor = chalk.red.bold;

        console.log(
          `${chalk.bold.white("Impact : ")} ${impactColor(analysis.impact)}`,
        );
        console.log(
          `${chalk.bold.white("Changes : ")} ${adds} additions ${chalk.dim("|")} ${dels} deletions`,
        );
        console.log(
          `${chalk.magenta("Summary : ")} ${chalk.white(analysis.summary)}\n`,
        );

        console.log(chalk.white.bold("Files Changed : "));

        if (analysis.files.length === 0) {
          console.log(chalk.dim("  No Files Changed."));
        } else {
          const MAX_FILES_TO_SHOW = 15;
          const filesToShow = analysis.files.slice(0, MAX_FILES_TO_SHOW);

          filesToShow.forEach((file) => {
            console.log(`   ${chalk.blue("•")} ${formatFilePath(file)}`);
          });

          if (analysis.files.length > MAX_FILES_TO_SHOW) {
            const hiddenCount = analysis.files.length - MAX_FILES_TO_SHOW;
            console.log(chalk.dim(`\n  ... and ${hiddenCount} more files.`));
          }
        }

        if (totalChanges > 500) {
          console.log(chalk.yellow.bold("⚠️  High Volume Warning"));
          console.log(
            chalk.yellow(
              `This diff contains ${totalChanges} lines of changes.`,
            ),
          );
          console.log(
            chalk.dim(
              "Large diffs can cause AI context limits to max out or degrade commit message quality.",
            ),
          );
          console.log(
            chalk.dim(
              `Consider breaking this into smaller, atomic commits using 'git add -p'.`,
            ),
          );
        }

        console.log("");
      } catch (error: any) {
        console.error(`\n ${chalk.red.bold("Internal Error : ")}`, error);
      }
    });

  //------------Generate Command------------

  program
    .command("generate")
    .description("Generate Commit Message ")
    .action(async () => {
      try {
        const diffData = await getGitDiff();

        const analysis = analyzeDiff(diffData.combined);

        if (analysis.files.length === 0) {
          console.log(
            chalk.yellow(
              "\n⚠️  No changes detected. Modify or stage files before generating a commit message.\n",
            ),
          );
          return;
        }

        console.log(chalk.cyan.bold("\n Commit-AI Generator\n"));
        console.log(chalk.dim("─".repeat(40)));

        let message: string;

        const spinner = ora("Analyzing diff and reading commit history...").start();

        try {
          const pastCommits = await getRecentCommits(10);

          spinner.text =  "Generating smart commit message...";

          message = await generateAICommitMessage(diffData.combined) ?? "";

          spinner.succeed(chalk.green("Commit message generated successfully!"));
        } catch (error:any) {

          spinner.fail(chalk.yellow("AI unavailable, using local generator..."));

          message = generateCommitMessage(analysis);
        }

        console.log(chalk.white.bold("Suggested Commit Message\n"));

        console.log(`   ${chalk.green.bold(message)}\n`);

        console.log(
          chalk.dim(
            `Tip : Run '${chalk.white('git commit -m "<message>"')}' to use this, or build the '${chalk.white("commit-ai commit")}' command to do it automatically \n`,
          ),
        );
      } catch (error: any) {
        console.error(`\n${chalk.red.bold("Internal Error : ")}`, error);
      }
    });

    //-------------Commit Command---------------

    program
    .command("commit")
    .description("Analyze,commit and push changes")
    .action(async()=>{
      try {
        await runCommitWorkflow();
      } catch (error) {
        console.log(error);
      }
    });

    //---------------Pull Request Command------------

    program
    .command("pr")
    .description(
      "Create Automated Pull Request!"
    )
    .action(async()=>{
      await runPRWorkflow();
    });
}
