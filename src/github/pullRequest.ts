import { github } from "./client.js";

export async function createPullRequest(
    owner:string,
    repo:string,
    title:string,
    body:string,
    branch:string,
){
    const response = await github.rest.pulls.create({
        owner,
        repo,
        title,
        body,
        head:branch,
        base:"main"
    });

    return response.data.html_url;
}