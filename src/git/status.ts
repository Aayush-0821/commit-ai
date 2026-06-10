import {simpleGit} from "simple-git";

const git = simpleGit();

export async function getGitStatus(){
    const status = await git.status();

    return status;
}