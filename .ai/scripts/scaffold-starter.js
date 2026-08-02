const fs = require('fs');
const path = require('path');

// Colors for console logging
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

// 1. Load state options from .ai/memory/state.json or arguments
let state = {
  structure: 'decoupled', // 'monorepo' or 'decoupled'
  dbEngine: 'mongodb', // 'mongodb' or 'postgres' or 'mysql'
  cacheEngine: 'local', // 'redis' or 'local'
  dockerSetup: false, // true or false
  authStrategy: 'jwt-cookie', // jwt-cookie, jwt-header, oauth
  mailProvider: 'smtp', // smtp, resend, sendgrid, ses, local
  storageProvider: 'local', // local, s3, digitalocean
  loggingProvider: 'local' // local, datadog, elk
};

const workspaceRoot = path.join(__dirname, '../..');
const backendPath = path.join(workspaceRoot, 'codebase/backend');
const frontendPath = path.join(workspaceRoot, 'codebase/frontend');
const sharedPath = path.join(workspaceRoot, 'codebase/shared');

// Clean up codebase utility
if (process.argv[2] === 'clean') {
  log('Cleaning up generated codebase files...', colors.yellow);
  const filesToDelete = [
    path.join(workspaceRoot, 'package.json'),
    path.join(workspaceRoot, 'package-lock.json'),
    path.join(workspaceRoot, 'docker-compose.yml'),
    path.join(backendPath, 'package.json'),
    path.join(backendPath, '.env'),
    path.join(frontendPath, 'package.json'),
  ];
  filesToDelete.forEach(f => {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      log(`Deleted: ${path.relative(workspaceRoot, f)}`, colors.green);
    }
  });
  if (fs.existsSync(sharedPath)) {
    fs.rmSync(sharedPath, { recursive: true, force: true });
    log('Deleted: codebase/shared/', colors.green);
  }
  log('Clean up finished! Codebase folder is reset.', colors.bold + colors.green);
  process.exit(0);
}

const statePath = path.join(__dirname, '../memory/state.json');
if (fs.existsSync(statePath)) {
  try {
    const fileState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state = { ...state, ...fileState };
    log('Loaded configuration options from .ai/memory/state.json', colors.green);
  } catch (err) {
    log('Failed to parse .ai/memory/state.json. Using defaults/CLI arguments.', colors.yellow);
  }
}

// CLI args override state JSON values
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--structure' && args[i + 1]) state.structure = args[i + 1];
  if (args[i] === '--db' && args[i + 1]) state.dbEngine = args[i + 1];
  if (args[i] === '--cache' && args[i + 1]) state.cacheEngine = args[i + 1];
  if (args[i] === '--docker') state.dockerSetup = true;
}

log(`Scaffolding target project with configuration:`, colors.bold + colors.blue);
console.log(JSON.stringify(state, null, 2));

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(backendPath);
ensureDir(frontendPath);

// Create root package.json based on repo structure choice
if (state.structure === 'monorepo') {
  ensureDir(sharedPath);
  
  // Scaffold Shared package.json
  fs.writeFileSync(path.join(sharedPath, 'package.json'), JSON.stringify({
    name: '@factory/shared',
    version: '1.0.0',
    private: true,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc'
    },
    dependencies: {
      "zod": "^3.22.0"
    }
  }, null, 2));

  // Scaffold Shared index.ts
  ensureDir(path.join(sharedPath, 'src'));
  fs.writeFileSync(path.join(sharedPath, 'src/index.ts'), `// Shared Types and Constants
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user'
}
`);

  // Scaffold Root package.json for monorepo
  fs.writeFileSync(path.join(workspaceRoot, 'package.json'), JSON.stringify({
    name: "saas-ai-factory",
    private: true,
    workspaces: [
      "codebase/backend",
      "codebase/frontend",
      "codebase/shared"
    ],
    scripts: {
      "dev:backend": "npm run start:dev --workspace=codebase/backend",
      "dev:frontend": "npm run dev --workspace=codebase/frontend",
      "build:backend": "npm run build --workspace=codebase/backend",
      "build:frontend": "npm run build --workspace=codebase/frontend",
      "build:shared": "npm run build --workspace=codebase/shared",
      "build:all": "npm run build:shared && npm run build:backend && npm run build:frontend",
      "test:backend": "npm run test --workspace=codebase/backend",
      "validate": "node .ai/scripts/validate-project.js"
    }
  }, null, 2));
  log('Scaffolded Shared workspace module & configured monorepo package.json', colors.green);
} else {
  // Decoupled structure: standalone packages
  fs.writeFileSync(path.join(workspaceRoot, 'package.json'), JSON.stringify({
    name: "saas-decoupled-project",
    private: true,
    scripts: {
      "dev:backend": "cd codebase/backend && npm run start:dev",
      "dev:frontend": "cd codebase/frontend && npm run dev",
      "build:backend": "cd codebase/backend && npm run build",
      "build:frontend": "cd codebase/frontend && npm run build",
      "validate": "node .ai/scripts/validate-project.js"
    }
  }, null, 2));
  log('Scaffolded decoupled settings (independent backend/frontend packages)', colors.green);
}

// 2. Scaffold Backend package.json dependencies based on DB and Caching
const backendDeps = {
  "@nestjs/common": "^11.0.0",
  "@nestjs/core": "^11.0.0",
  "@nestjs/config": "^3.0.0",
  "@nestjs/swagger": "^8.0.0",
  "reflect-metadata": "^0.2.0",
  "rxjs": "^7.8.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.0",
  "bcrypt": "^5.1.0",
  "uuid": "^9.0.0",
  "joi": "^17.9.0",
  "winston": "^3.10.0"
};

const backendDevDeps = {
  "@nestjs/cli": "^11.0.0",
  "@nestjs/testing": "^11.0.0",
  "typescript": "^5.0.0",
  "ts-node": "^10.9.0",
  "jest": "^29.6.0"
};

if (state.dbEngine === 'mongodb') {
  backendDeps['@nestjs/mongoose'] = '^11.0.0';
  backendDeps['mongoose'] = '^8.0.0';
} else {
  // SQL uses Prisma
  backendDeps['@prisma/client'] = '^5.0.0';
  backendDevDeps['prisma'] = '^5.0.0';
}

if (state.cacheEngine === 'redis') {
  backendDeps['@nestjs/cache-manager'] = '^2.0.0';
  backendDeps['cache-manager'] = '^5.0.0';
  backendDeps['cache-manager-redis-yet'] = '^1.4.0';
  backendDeps['@nestjs/bullmq'] = '^11.0.0';
  backendDeps['bullmq'] = '^5.0.0';
} else {
  // Local cache
  backendDeps['@nestjs/cache-manager'] = '^2.0.0';
  backendDeps['cache-manager'] = '^5.0.0';
  backendDeps['@nestjs/schedule'] = '^4.0.0';
}

// Write backend package.json
fs.writeFileSync(path.join(backendPath, 'package.json'), JSON.stringify({
  name: "backend",
  version: "1.0.0",
  private: true,
  scripts: {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "test": "jest"
  },
  dependencies: backendDeps,
  devDependencies: backendDevDeps
}, null, 2));

// Create sample .env file in backend
let envContent = `NODE_ENV=development
PORT=3001
JWT_SECRET=supersecretkeyshouldbe32characterslongormore!
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
`;

if (state.dbEngine === 'mongodb') {
  envContent += `MONGODB_URI=mongodb://localhost:27017/saasdb\n`;
} else {
  envContent += `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saasdb?schema=public\n`;
}

if (state.cacheEngine === 'redis') {
  envContent += `REDIS_URL=redis://localhost:6379\n`;
}

fs.writeFileSync(path.join(backendPath, '.env'), envContent);
log('Scaffolded backend package.json and development .env file', colors.green);

// 3. Scaffold Docker Compose if needed
if (state.dockerSetup) {
  const composePath = path.join(workspaceRoot, 'docker-compose.yml');
  let composeContent = `version: '3.8'

services:
`;

  if (state.dbEngine === 'mongodb') {
    composeContent += `  mongodb:
    image: mongo:7.0
    container_name: saas-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

`;
  } else if (state.dbEngine === 'postgres') {
    composeContent += `  postgres:
    image: postgres:15
    container_name: saas-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: saasdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

`;
  } else if (state.dbEngine === 'mysql') {
    composeContent += `  mysql:
    image: mysql:8.0
    container_name: saas-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: saasdb
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

`;
  }

  if (state.cacheEngine === 'redis') {
    composeContent += `  redis:
    image: redis:7.0-alpine
    container_name: saas-redis
    ports:
      - "6379:6379"

`;
  }

  composeContent += `volumes:\n`;
  if (state.dbEngine === 'mongodb') composeContent += `  mongodb_data:\n`;
  if (state.dbEngine === 'postgres') composeContent += `  postgres_data:\n`;
  if (state.dbEngine === 'mysql') composeContent += `  mysql_data:\n`;

  fs.writeFileSync(composePath, composeContent);
  log('Scaffolded docker-compose.yml with configured services', colors.green);
}

log('\nSuccessfully completed codebase scaffolding initialization!', colors.bold + colors.green);
