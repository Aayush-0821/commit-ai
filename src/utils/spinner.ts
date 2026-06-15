import ora, {Ora} from "ora";

let activeSpinner: Ora | null = null;

export function startSpinner(text:string){
    if(activeSpinner){
        activeSpinner.stop();
    }

    activeSpinner = ora(text).start();

    return activeSpinner;
}

export function stopSpinner(){
    if(activeSpinner){
        activeSpinner.stop();
        activeSpinner = null;
    }
}