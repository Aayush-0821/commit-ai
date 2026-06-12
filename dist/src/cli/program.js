import { Command } from "commander";
import chalk from "chalk";
import { registerCommands } from "./commands.js";
const program = new Command();
program
    .name("commit-ai")
    .description("AI powered Git workflow assistant")
    .version("1.0.0");
registerCommands(program);
program.action(() => {
    const logo = chalk.cyan(`
   ____                          _ _            _    ___ 
  / ___|___  _ __ ___  _ __ ___ (_) |_       _ / \\  |_ _|
 | |   / _ \\| '_ \` _ \\| '_ \` _ \\| | __|____ (_)/ _ \\  | | 
 | |__| (_) | | | | | | | | | | | | ||_____| |/ ___ \\ | | 
  \\____\\___/|_| |_| |_|_| |_| |_|_|\\__|      /_/   \\_\\___|
  `);
    const subtitle = chalk.magentaBright("  AI powered Git workflow Assistant \n");
    const commandsHeader = chalk.bold.white("  Commands:\n");
    const commandsList = `
    ${chalk.green("commit-ai status")}    ${chalk.dim("Show current branch status")}
    ${chalk.green("commit-ai diff")}      ${chalk.dim("Analyze uncommitted changes")}
    ${chalk.green("commit-ai generate")}  ${chalk.dim("Generate a smart commit message")}
    ${chalk.green("commit-ai commit")}    ${chalk.dim("Run the full auto-commit flow")}
    ${chalk.green("commit-ai pr")}        ${chalk.dim("Create an automated Pull Request")}
  `;
    console.log(logo);
    console.log(subtitle);
    console.log(commandsHeader);
    console.log(commandsList);
});
program.parse();
