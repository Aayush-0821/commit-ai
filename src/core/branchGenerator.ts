import { DiffAnalysis } from "./diffTypes.js";

export function generateBranchName(
    analysis:DiffAnalysis,
    commitMessage?:string
){
    let type = "feature";

    const message = commitMessage?.toLowerCase() || "";

    if(message.includes("fix") || message.includes("bug")){
        type = "fix";
    }
    else if(message.includes("refactor")){
        type = "refactor";
    }
    else if(message.includes("test")){
        type = "test";
    }
    else if(message.includes("chore")){
        type = "chore";
    }

    const description = extractDescription(analysis,message);

    return `${type}/${description}`;
}

function extractDescription(analysis:DiffAnalysis,message:string){
    if(message){
        return clean(message.replace( /^(feat|fix|chore|refactor|test).*?:/,
                ""));
    }

    const file = analysis.files[0]?.split("/").pop()?.replace(/\..*/,"");

    return file || "update-code";
}

function clean(
    text:string
){
    return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .split("-")
    .filter((word)=>word.length>2)
    .filter((word)=>word!=="add" && word !== "update" && word !== "fix")
    .slice(0,3)
    .join("-");
}