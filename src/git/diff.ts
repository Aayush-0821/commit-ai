import { simpleGit } from "simple-git";
import fs from "fs/promises";

const git = simpleGit();

export async function getRecentCommits(count:number = 10):Promise<string>{
  try {
    const log = await git.log({maxCount : count});

    return log.all.map(commit => commit.message).join("\n");
  } catch (error:any) {
    return "";
  }
}

export async function getGitDiff() {
  const unstaged = await git.diff();

  const staged = await git.diff(["--cached"]);

  const status = await git.status();

  let untrackedDiff = "";

  for (const file of status.not_added) {
    try {
      const content = await fs.readFile(file, "utf-8");

      untrackedDiff += `diff --git a/${file} b/${file}\n`;

      untrackedDiff += `+++ b/${file}\n`;

      content.split("\n").forEach((line) => {
        untrackedDiff += `+${line}\n`;
      });
    } catch {
      continue;
    }
  }

  return {
    combined: unstaged + "\n" + staged + "\n" + untrackedDiff,
  };
}
