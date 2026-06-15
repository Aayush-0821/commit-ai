import { getConfig } from "../config/configManager.js";
import { DiffAnalysis } from "./diffTypes.js";

export function generateCommitMessage(
    analysis: DiffAnalysis
){

    const config = getConfig();

    if(config?.preferences.commitStyle === "simple"){
        return generateSimpleMessage(analysis);
    }

    const type = detectType(analysis);

    const scope = detectScope(analysis);

    const message = buildMessage(
        type,
        scope,
        analysis
    );

    return message;
}

function detectType(
    analysis:DiffAnalysis
){
    const summary = analysis.summary.toLowerCase();

    if(summary.includes("test updated")) return "test";

    if(summary.includes("depedency")) return "chore";

    if(summary.includes("authentication")) return "feat";

    if(analysis.deletions > analysis.additions) return "refactor";

    return "feat";
}

function detectScope(
    analysis:DiffAnalysis
){
    const file = analysis.files[0]?.toLowerCase();

    if(!file){
        return "project";
    }

    if(file.includes("auth")) return "auth";

    if(file.includes("api")) return "api";

    if(file.includes("ui")) return "ui";

    return "core";
}

function buildMessage(
    type:string,
    scope:string,
    analysis:DiffAnalysis
){
    let action = "update code";

    if(analysis.additions > analysis.deletions) action = "add changes";

    else action = "improve code";

    return `${type}(${scope}) : ${action}`;
}

function generateSimpleMessage(
    analysis:DiffAnalysis
){
    return `Update ${analysis.summary.toLowerCase()}`;
}