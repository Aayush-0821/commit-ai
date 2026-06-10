import { simpleGit } from "simple-git";
const git = simpleGit();
export async function checkRepository() {
    try {
        await git.status();
        return true;
    }
    catch (error) {
        return false;
    }
}
