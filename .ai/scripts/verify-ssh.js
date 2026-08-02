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

const urls = process.argv.slice(2);

if (urls.length === 0) {
  log('SaaS AI Factory — SSH Repository Connection Verifier', colors.bold + colors.blue);
  console.log('\nUsage: node verify-ssh.js <ssh-url-1> [ssh-url-2] ...\n');
  process.exit(0);
}

log(`Starting validation for ${urls.length} remote repository SSH links...\n`, colors.bold + colors.blue);

let hasFailure = false;

urls.forEach((url, index) => {
  log(`[${index + 1}/${urls.length}] Testing connection to: ${url}`, colors.yellow);
  
  if (!url.startsWith('git@github.com:') && !url.startsWith('ssh://')) {
    log(`✖ Error: "${url}" is not a valid SSH repository URL. (Format should start with git@github.com:)`, colors.red);
    hasFailure = true;
    return;
  }

  try {
    // Run git ls-remote to test connection without cloning
    execSync(`git ls-remote -h "${url}"`, { stdio: 'ignore', timeout: 10000 });
    log(`✔ Connection successful! Access is verified.\n`, colors.green);
  } catch (err) {
    log(`✖ Error: Connection failed for ${url}`, colors.red);
    log(`  Possible causes:`, colors.red);
    log(`  1. The repository does not exist or URL is misspelled.`, colors.yellow);
    log(`  2. Your SSH public key is not registered on GitHub.`, colors.yellow);
    log(`  3. Your local ssh-agent does not have the correct key loaded.`, colors.yellow);
    log(`  * Suggestion: Test global connection by running: ssh -T git@github.com\n`, colors.blue);
    hasFailure = true;
  }
});

if (hasFailure) {
  process.exit(1);
} else {
  log('✔ All repository SSH connections are working and verified!', colors.bold + colors.green);
  process.exit(0);
}
