import OpenAI from "openai";
import { getConfig } from "../config/configManager.js";


export function getOpenAIClient(){

    const config = getConfig();


    if(!config?.apiKey){
        throw new Error(
            "NO_AI_CONFIG"
        );
    }

    return new OpenAI({

        apiKey: config.apiKey,

        baseURL:
        "https://openrouter.ai/api/v1"

    });

}