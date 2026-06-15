import {simpleGit} from "simple-git";

const git = simpleGit();

export async function getGitStatus(){
    const status = await git.status();

    return status;
}

export async function stashChanges(){
    await git.stash();
}

export async function popStash(){
    await git.stash(["pop"]);
}