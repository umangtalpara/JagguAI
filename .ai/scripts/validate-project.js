const fs = require('fs');
const path = require('path');

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

const codebaseDir = path.join(__dirname, '../../codebase');
let violationsCount = 0;

function reportViolation(file, rule, description) {
  violationsCount++;
  console.log(`${colors.red}[VIOLATION]${colors.reset} in ${colors.bold}${path.relative(codebaseDir, file)}${colors.reset}`);
  console.log(`  Rule: ${rule}`);
  console.log(`  Detail: ${description}\n`);
}

// 1. Validate File Names (kebab-case)
function checkKebabCase(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    
    // Ignore dotfiles, node_modules, dist, build, test spec artifacts
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
      return;
    }

    // Check kebab-case regex: lowercase letters, numbers, and hyphens, optional extension
    const nameWithoutExt = entry.name.split('.')[0] || '';
    const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    
    if (nameWithoutExt && !kebabCaseRegex.test(nameWithoutExt)) {
      // Allow standard config files (e.g. tsconfig.json, next.config.js, tailwind.config.ts)
      const allowedConfigs = ['next-env.d', 'tsconfig', 'package', 'package-lock'];
      if (!allowedConfigs.includes(nameWithoutExt)) {
        reportViolation(
          fullPath,
          'Naming Convention (kebab-case)',
          `File/Folder name "${entry.name}" must use kebab-case (all lowercase with hyphens).`
        );
      }
    }

    if (entry.isDirectory()) {
      checkKebabCase(fullPath);
    } else {
      checkFileContentRules(fullPath);
    }
  });
}

// 2. Validate Code length, function sizes, and patterns
function checkFileContentRules(file) {
  const ext = path.extname(file);
  if (ext !== '.ts' && ext !== '.tsx' && ext !== '.js' && ext !== '.jsx') return;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // Check file length limit (< 200 lines for Services/Controllers)
  if (lines.length > 200 && (file.endsWith('.service.ts') || file.endsWith('.controller.ts'))) {
    reportViolation(
      file,
      'Class Length Limit (<200 lines)',
      `File is too long (${lines.length} lines). Exceeds the 200-line limit for services/controllers.`
    );
  }

  // Check data access rules inside services
  if (file.endsWith('.service.ts')) {
    const mongooseQueries = [
      '\\.find\\(',
      '\\.findOne\\(',
      '\\.findById\\(',
      '\\.create\\(',
      '\\.updateOne\\(',
      '\\.updateMany\\(',
      '\\.deleteOne\\(',
      '\\.deleteMany\\('
    ];

    mongooseQueries.forEach(queryPattern => {
      const regex = new RegExp(queryPattern);
      lines.forEach((line, idx) => {
        if (regex.test(line) && !line.includes('//') && !line.includes('prisma')) {
          reportViolation(
            file,
            'Data Access Pattern (Repository Pattern)',
            `Line ${idx + 1}: Direct database operations found on Mongoose Model. Services must delegate database queries to Repositories.`
          );
        }
      });
    });
  }

  // Check for any type usage
  lines.forEach((line, idx) => {
    if (line.includes(': any') && !line.includes('//') && !line.includes('eslint-disable')) {
      reportViolation(
        file,
        'Type Safety (No any)',
        `Line ${idx + 1}: The 'any' type is forbidden. Use specific interfaces, types, or 'unknown'.`
      );
    }
  });
}

log('Starting project linter and validation checks...', colors.bold + colors.blue);
checkKebabCase(codebaseDir);

if (violationsCount === 0) {
  log('✔ All checks passed successfully! Codebase is compliant with workspace architecture rules.', colors.green);
  process.exit(0);
} else {
  log(`✘ Validation failed: ${violationsCount} architectural violations found. Please fix the violations before submitting.`, colors.red);
  process.exit(1);
}
