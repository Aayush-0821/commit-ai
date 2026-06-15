import chalk from "chalk";
import { stashChanges,popStash } from "../git/status.js";
import { switchBranch } from "../git/branch.js";
import { analyzeRepository } from "../core/statusAnalyzer.js";

export async function prepareBranchSwitch(
    targetBranch:string
){
    const status = await analyzeRepository();

    if(!status.clean){
        console.log(chalk.yellow("\n UnCommitted Changes Detected. Creating temporary Stash..."));

        await stashChanges();

        console.log(chalk.green("✔ Changes safely stored"));
    }

    const branch = await switchBranch(targetBranch);

    console.log(chalk.green(`✔ Switched to ${branch}`));

    const hadStash = !status.clean;

    if(hadStash){
        console.log(chalk.yellow("Restoring your changes..."));

        await popStash();

        console.log(chalk.green("✔ Changes restored"));
    }

    return branch;
}