import OpenAI from "openai";
import { getConfig } from "../config/configManager.js";


export function getOpenAIClient(){

    const config = getConfig();


    if(!config){
        throw new Error(
            "Commit-AI is not configured. Run commit-ai init first."
        );
    }


    return new OpenAI({

        apiKey: config?.apiKey ?? "",


        baseURL:
        config.provider === "openrouter"
        ?
        "https://openrouter.ai/api/v1"
        :
        undefined

    });

}