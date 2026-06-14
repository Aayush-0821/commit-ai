import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(),".commit-ai");

const CONFIG_FILE = path.join(CONFIG_DIR,"config.json");

export interface CommitAIConfig{
    provider : string,
    apiKey : string,
    githubToken? : string,
}

export function saveConfig(
    config:CommitAIConfig
){
    if(!fs.existsSync(CONFIG_DIR)){
        fs.mkdirSync(CONFIG_DIR);
    }

    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(
            config,
            null,
            2
        )
    );
}

export function getConfig():CommitAIConfig | null{
    if(!fs.existsSync(CONFIG_FILE)){
        return null;
    }

    const data = fs.readFileSync(
        CONFIG_FILE,
        "utf-8"
    );

    return JSON.parse(data);
}