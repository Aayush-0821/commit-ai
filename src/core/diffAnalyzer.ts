export function analyzeDiff(diff:string){
    if(!diff){
        return {
            files:[],
            additions:0,
            deletions:0,
            impact:"LOW",
            summary:"No changes detected"
        }
    }

    const lines = diff.split("\n");

    const files:string[] = [];

    let additions = 0;

    let deletions = 0;

    lines.forEach((line)=>{
        if(line.startsWith("+++ b/") || line.startsWith("diff --git")){
            files.push(
                line.replace("+++ b/","")
            );
        }

        if(line.startsWith("+") && !line.startsWith("+++")){
            additions++;
        }

        if(line.startsWith("-") && !line.startsWith("---")){
            deletions++;
        }
    });

    let impact = "LOW";

    const total = additions + deletions;

    if(total > 50){
        impact="HIGH";
    }
    else if(total > 15){
        impact = "MEDIUM";
    }

    return {
        files,
        additions,
        deletions,
        impact,
        summary:generateSummary(files)
    };
}

function generateSummary(
    files:string[]
){
    const joined = files.join(" ");

    if(joined.includes("auth") || joined.includes("login")){
        return "Authentication related changes detected";
    }

    if(joined.includes("test")){
        return "Tests updated";
    }

    if(joined.includes("packages")){
        return "Dependencies changed";
    }

    return "General code changes";
}