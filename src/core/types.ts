export interface RepositoryAnalysis{
    branch:string;
    clean:boolean;
    files:{
        staged:string[];
        modified:string[];
        untracked:string[];
        deleted:string[];
        renamed:string[];
        ignored:string[];
    }
}