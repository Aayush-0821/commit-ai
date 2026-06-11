import {simpleGit} from "simple-git";

const git = simpleGit();

export async function createBranch(
    name:string
){
    await git.checkoutLocalBranch(name);
}