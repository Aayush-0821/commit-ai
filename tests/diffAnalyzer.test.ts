import { describe,test,expect } from "vitest";
import { analyzeDiff } from "../src/core/diffAnalyzer";

describe("Diff Analyzer",()=>{
    
    test("Detects Changed Files",()=>{

        const diff = `diff --git a/src/test.ts b/src/test.ts +console.log("hello")
        `;

        const result = analyzeDiff(diff);

        expect(result.files.length).toBeGreaterThan(0);
    });

    test("Handles Empty Diff",()=>{
        
        const result = analyzeDiff("");

        expect(result.files.length).toBe(0);
    });
});