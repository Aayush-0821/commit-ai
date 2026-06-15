import { describe,expect,test } from "vitest";
import { generateBranchName } from "../src/core/branchGenerator";

describe("Branch Generator",()=>{

    test("Generates Feature Branch Name",()=>{
        
        const analysis:any = {
            files:[
                "src/auth/login.ts"
            ],
            summary:"added login feature"
        };

        const result = generateBranchName(
            analysis,
            "feat(auth) : add jwt login"
        );

        expect(result).toContain("feat");
    });

    test("Creates FallBack Branch",()=>{

        const result = generateBranchName(
            {
                files:[]
            } as any,
            "chore : update"
        );

        expect(result.length).toBeGreaterThan(0);
    });
});