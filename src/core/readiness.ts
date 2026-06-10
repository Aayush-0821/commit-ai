import { WriteStream } from "node:fs";
import { RepositoryAnalysis } from "./types.js";

export function calculateReadiness(
    analysis:RepositoryAnalysis
){
    let score = 100;

    const warnings:string[] = [];

    const totalFiles = 
    analysis.files.staged.length+
    analysis.files.modified.length+
    analysis.files.untracked.length+
    analysis.files.deleted.length+
    analysis.files.renamed.length;

    if(analysis.files.untracked.length > 0){
        score -= 10;

        warnings.push(
            "Untracked files detected"
        );
    }

    if(totalFiles > 10){
        score -= 15;

        warnings.push(
            "Large number of changed files"
        );
    }

    const allFiles = [
        ...analysis.files.staged,
        ...analysis.files.modified,
        ...analysis.files.deleted
    ];

    const hasSourceChanges = 
        allFiles.some(file => 
            file.includes("src")
        );

    const hasTests = 
        allFiles.some(file=>
            file.includes("test") ||
            file.includes("spec")
        );

    if(hasSourceChanges && !hasTests){
        score -= 20;

        warnings.push(
            "Source changed without tests"
        );
    }

    if(analysis.files.deleted.length){
        score -= 15;

        warnings.push(
            "Files deleted"
        );
    }

    if(totalFiles > 0 && totalFiles <= 5){
        score += 5;
    }

    if(hasTests) score += 5;

    score = Math.max(0,Math.min(100,score));

    return {
        score,
        warnings
    };
}