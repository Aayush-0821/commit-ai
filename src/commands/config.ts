import chalk from "chalk";
import { getConfig } from "../config/configManager.js";
import {exec} from "child_process";
import os from "os";
import path from "path";

function getConfigPath(){
    return path.join(
        os.homedir(),
        ".commit-ai",
        "config.json"
    );
}

export function showConfig(
    edit:boolean=false
){
    const config = getConfig();

    if(!config){
        console.log(chalk.yellow("No Configuration Found. Run commit-ai init"));

        return;
    }

    if(edit){
        const file = getConfigPath();

        exec(`code "${file}"`,(error)=>{
            if(error){
                console.log(chalk.yellow("VS Code not found. Edit Manually at :"));
                console.log(chalk.dim(` ${file}\n`));
                return;
            }

            console.log(chalk.green("\nOpened config file in VS Code\n"))
        });

        return;
    }

    const on = chalk.green("Enabled");
    const off = chalk.red("Disabled");
    console.log(
    chalk.cyan(`
  ╭──────────────────────────────────────────╮
  │   Commit-AI Active Configuration         │
  ╰──────────────────────────────────────────╯
  `)
  );

    // 2. Core Settings
  console.log(`${chalk.bold.white("   AI Provider:")}      ${chalk.magenta(config.provider)}`);
  console.log(`${chalk.bold.white("   Max Diff Size:")}    ${chalk.yellow(config.preferences.maxDiffSize)} lines`);
  console.log(`${chalk.bold.white("   Branch Strategy:")}  ${chalk.blue(config.preferences.branchStrategy)}\n`);

  // 3. Workflow Preferences
  console.log(chalk.bold.white("  Workflow Preferences:"));
  console.log(chalk.dim("  " + "─".repeat(30)));
  console.log(`  Auto Commit:           ${config.preferences.autoCommit ? on : off}`);
  console.log(`  Auto Push:             ${config.preferences.autoPush ? on : off}`);
  console.log(`  Confirm Before Commit: ${config.preferences.confirmBeforeCommit ? on : off}`);
  console.log(`  Confirm Before Push:   ${config.preferences.confirmBeforePush ? on : off}\n`);

  // 4. Helpful Tip Footer
  console.log(
    chalk.dim(
      `   Tip: Run ${chalk.white("commit-ai config --edit")} to modify these settings in VS Code.\n`
    )
  );
}