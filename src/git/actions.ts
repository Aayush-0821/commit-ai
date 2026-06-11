import {simpleGit} from "simple-git";

const git = simpleGit();

export async function stageAll(){
    await git.add(".");
}

export async function commit(
    message:string
){
    await git.commit(message);
}

export async function push(){
    await git.push();
}