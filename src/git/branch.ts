import {simpleGit} from "simple-git";

const git = simpleGit();

export async function createBranch(
name:string
){

    try{

        await git.checkoutLocalBranch(name);

    }
    catch{

        const fallback =
        `${name}-${Date.now()
        .toString()
        .slice(-4)}`;


        await git.checkoutLocalBranch(
            fallback
        );

        return fallback;
    }


    return name;

}