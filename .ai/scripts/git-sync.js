const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

// Load configurations from .ai/settings.json
const settingsPath = path.join(__dirname, '../settings.json');
let settings = {};

if (fs.existsSync(settingsPath)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    log('Error parsing settings.json. Make sure it is valid JSON.', colors.red);
    process.exit(1);
  }
} else {
  log('settings.json not found in .ai/ folder!', colors.red);
  process.exit(1);
}

const remotes = settings.git_remotes || {};
const backendRemote = remotes.backend;
const frontendRemote = remotes.frontend;

const command = process.argv[2];
const targetBranch = process.argv[3] || 'main'; // Default branch is main

function runGitCommand(cmd) {
  try {
    log(`Executing: ${cmd}`, colors.blue);
    const stdout = execSync(cmd, { stdio: 'inherit' });
    log('Command executed successfully!\n', colors.green);
  } catch (err) {
    log(`Error executing git command: ${err.message}`, colors.red);
    process.exit(1);
  }
}

function pushSubtree(prefix, remoteUrl, branch) {
  if (!remoteUrl || remoteUrl.includes('yourusername')) {
    log(`Error: Remote URL for prefix "${prefix}" is not configured. Please set it in .ai/settings.json`, colors.red);
    return;
  }
  log(`Pushing directory "${prefix}" to remote repository: ${remoteUrl} on branch: ${branch}...`, colors.bold + colors.yellow);
  const cmd = `git subtree push --prefix=${prefix} "${remoteUrl}" ${branch}`;
  runGitCommand(cmd);
}

function pullSubtree(prefix, remoteUrl, branch) {
  if (!remoteUrl || remoteUrl.includes('yourusername')) {
    log(`Error: Remote URL for prefix "${prefix}" is not configured. Please set it in .ai/settings.json`, colors.red);
    return;
  }
  log(`Pulling changes for "${prefix}" from remote repository: ${remoteUrl} on branch: ${branch}...`, colors.bold + colors.yellow);
  const cmd = `git subtree pull --prefix=${prefix} "${remoteUrl}" ${branch} --squash -m "Merge updates from downstream ${prefix} repo"`;
  runGitCommand(cmd);
}

if (command === 'push-backend') {
  pushSubtree('codebase/backend', backendRemote, targetBranch);
} else if (command === 'push-frontend') {
  pushSubtree('codebase/frontend', frontendRemote, targetBranch);
} else if (command === 'push-all') {
  pushSubtree('codebase/backend', backendRemote, targetBranch);
  pushSubtree('codebase/frontend', frontendRemote, targetBranch);
} else if (command === 'pull-backend') {
  pullSubtree('codebase/backend', backendRemote, targetBranch);
} else if (command === 'pull-frontend') {
  pullSubtree('codebase/frontend', frontendRemote, targetBranch);
} else {
  console.log(`
SaaS AI Factory — Downstream Repositories Git Sync CLI

Usage: node git-sync.js <command> [target-branch]

Commands:
  push-backend      Push codebase/backend changes to the backend repository
  push-frontend     Push codebase/frontend changes to the frontend repository
  push-all          Push both backend and frontend codebase directories to their repositories
  pull-backend      Pull changes from the backend repository into codebase/backend
  pull-frontend     Pull changes from the frontend repository into codebase/frontend

Target Branch:
  Default is 'main'. You can override it by specifying a branch, e.g.,
  node git-sync.js push-backend develop
`);
}
