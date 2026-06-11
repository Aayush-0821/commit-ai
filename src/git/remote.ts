import {simpleGit} from "simple-git";

const git = simpleGit();

export async function getRemoteUrl(){
    const remote = await git.getRemotes(true);

    const origin = remote.find(r=>r.name==="origin");

    if(!origin) throw new Error("NO_REMOTE_FOUND");

    return origin.refs.fetch;
}