import chalk from "chalk";
import { getConfig } from "../config/configManager.js";

export function showConfig(){
    const config = getConfig();

    if(!config){
        console.log(chalk.yellow("No Configuration Found. Run commit-ai init"));

        return;
    }

    console.log(chalk.cyan.bold("\n Commit-AI Configuration\n"));

    console.log(
        `AI-Provider : ${config.provider}

        Preferences : 

        Auto Commit : ${config.preferences.autoCommit}

        Auto Push : ${config.preferences.autoPush}

        Confirm Before Commit : ${config.preferences.confirmBeforeCommit}

        Confirm Before Push : ${config.preferences.confirmBeforePush}

        Branch Strategy : ${config.preferences.branchStrategy}

        Max Diff Size : ${config.preferences.maxDiffSize}
        `
    );
}