export function parseGithubUrl(
    url:string
){
    const match = url.match(/github\.com[/:](.*?)\/(.*?)\.git/);

    if(!match){
        throw new Error("INVALID_GITHUB_URL");
    }

    return {
        owner:match[1],
        repo:match[2]
    };
}