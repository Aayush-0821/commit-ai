#  Commit-AI

> AI-powered Git workflow assistant that generates intelligent commit messages, manages branches, pushes changes, and creates GitHub Pull Requests — all from your terminal.

<img width="857" height="647" alt="image" src="https://github.com/user-attachments/assets/74a2e9a4-2bc3-4067-9643-9ef892d9a4e2" />


##  Overview

Commit-AI is a developer productivity CLI tool that automates the repetitive parts of the Git workflow.

Instead of manually:

- checking your changes
- writing commit messages
- creating branches
- committing code
- pushing changes
- opening Pull Requests

Commit-AI turns the entire process into a single command:

```bash
commit-ai pr
```

It analyzes your repository changes, understands your code diff using AI, generates a conventional commit message, prepares a PR description, safely handles branches, pushes your code, and creates a GitHub Pull Request.

## Problem

Every Developer has faced this : 

```
git status

git diff

"what should I name this commit?"

git add .

git commit -m "update"

git push

go to GitHub

create PR

write description
```

The Git workflow is powerful, but repetitive. Commit-AI removes that friction.

## Features

### AI Commit Message Generation

Commit-AI analyzes your git diff and creates meaningful conventional commits.

<u>Example</u> : 

Before :
```
git commit -m "changes"
```

After : 
```
feat(auth) : add jwt authentication middleware
```

Supported Formats : 
```
feat
fix
chore
refactor
docs
test
```

### AI Generated Pull Request

- feat 
- fix 
- chore 
- refactor 
- docs 
- test 

<u>Example :</u>

```
Title:

feat(auth): add jwt authentication


Body:

## Summary

Added JWT based authentication flow.

## Changes

- Added token validation
- Added middleware
- Updated auth routes

## Risks

- Existing users need migration
```

### Smart Branch Management

Commit-AI understands Git Branches.

- <b>Use Current Branch</b>
```
main
```

- <b>Switch Existing Branch</b>

<u>Example :</u>

```
main
develop
feature/payment
feature/dashboard
```

Commit-AI safely moves your changes.

- <b> Create new Branch Automatically</b>

<u>Example : </u>

```
fix/payment-validation
feat/user-authentication
refactor/api-layer
```

Generated from your changes.

### One Command WorkFlow

The complete PR flow :
```
commit-ai pr
```

Does :
```
Analyze repository
        ↓
Read git diff
        ↓
Generate AI commit
        ↓
Generate PR description
        ↓
Select branch
        ↓
Commit changes
        ↓
Push changes
        ↓
Create GitHub PR
```

## Installation

### Install globally using npm

```
npm install -g commit-ai
```

<b>Verify Installtion : </b>

```
commit-ai --version
```

## Configuration

Before using commit-AI, initialize your setup.

Run :
```
commit-ai init
```

You will configure:

- GitHub repository access
- AI API key

## Commands

### 1) commit-ai init

Initialize commit-ai    Configuration.

<b>Usage :</b>
```
commit-ai init
```

<b>Creates Configuration : </b>

```
~/.commit-ai/config.json
```

<b>Stores :</b>

- Github Token
- AI Settings
- Preferences

### 2) commit-ai status

Analyze Repository State.

<u>Example :</u>

```
commit-ai status
```

<u>Output :</u>

```
Commit-AI Repository Analysis

Branch:
feature/auth

Status:
✔ Working directory clean

Files:
0 modified
```

### 3) commit-ai commit

Generate an AI Commit Message.

<u>Example :</u>

```
commit-ai commit
```

<u>Flow :</u>
```
Read diff

AI analyzes changes

Generate message

Confirm

Commit
```

<u>Example Output :</u>

```
Generated:

feat(api): add user validation endpoint

Commit?
```

### 4) commit-ai pr

The Main Command.

<u>Example :</u>

```
commit-ai pr
```

<u>Full WorkFlow</u>

```
✔ Repository detected

✔ Changes analyzed

✔ Commit generated


Where should PR be created?

1. Current branch
2. Existing branch
3. New branch


✔ Commit created

✔ Code pushed

✔ Pull Request created


GitHub URL:
https://github.com/user/repo/pull/10
```

## Architecture

Commit-AI is built with a modular Architecture.

```
src

├── ai
│   └── commitAI.ts
│
├── core
│   ├── diffAnalyzer.ts
│   ├── branchGenerator.ts
│   └── statusAnalyzer.ts
│
├── git
│   ├── actions.ts
│   ├── branch.ts
│   ├── diff.ts
│   └── remote.ts
│
├── github
│   ├── parser.ts
│   ├── pullRequest.ts
│   └── prGenerator.ts
│
└── workflow

    ├── prWorkflow.ts
    └── branchManager.ts
```

## Internal WorkFlow

When running : 

```
commit-ai pr
```

<u><b>Internally : </b></u>

### 1) Repository Detection

Reads :
```
git remote -v
```

Extracts : 
```
owner
repository
```

### 2) Diff Analysis

Runs :
```
git diff
```

Analysis :
- changed files
- additions
- removals
- modifications

### 3) AI Processing

The diff is sent to AI.

<u>AI Returns :</u>

```
commit message

PR Title

PR Description
```

### 4) Branch Handling

Commit-AI checks :
```
current branch

working tree status

available branches
```
Then safely switches or creates.

### 5) Git Execution

<u>Runs :</u>
```
git add .

git commit

git push
```

### 6) Github API

<u>Creates :</u>
```
Pull Request
```

using Github REST API.

## Testing

<b>Commit-AI uses :</b>
- Vitest
- Unit Testing

<b>Run Tests :</b>
```
npm test
```

<b><u>Current Coverage :</u></b>
```
✓ Commit message validation

✓ Diff analyzer

✓ Branch generator
```

## Tech Stack

### Runtime
- Node.js
- TypeScript

### Git Integration
- simple-git

### CLI
- commander
- inquirer
- chalk
- ora

### AI
- OpenRouter API

### Github
- Octokit

### Testing
- Vitest

## Contributing

Contributions are Welcome.

<u>Steps :</u>

```
git clone https://github.com/Aayush-0821/commit-ai.git

npm install

npm run build

npm test
```

<u>Create a Branch :</u>

```
git checkout -b feature/new-feature
```

Make Changes.

<u>Create PR :</u>

```
commit-ai pr
```

## License

<b>MIT License</b>

## Author

Built by Aayush Vats
