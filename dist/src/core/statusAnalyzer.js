import { getGitStatus } from "../git/status.js";
import { checkRepository } from "../git/checkRepo.js";
export async function analyzeRepository() {
    const isRepo = await checkRepository();
    if (!isRepo) {
        throw new Error("NO_GIT_REPOSITORY");
    }
    const status = await getGitStatus();
    return {
        branch: status.current ?? "",
        clean: status.isClean(),
        files: {
            staged: status.staged,
            modified: status.modified,
            untracked: status.not_added,
            deleted: status.deleted,
            renamed: status.renamed.map(file => file.to),
            ignored: status.ignored ?? []
        }
    };
}
