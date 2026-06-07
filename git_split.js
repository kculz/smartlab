const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backupDir = path.resolve('_temp_git_split_backup');

// Helper to copy recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

// Helper to check if path is in backup
function copyFromBackup(relativePaths) {
  for (const rel of relativePaths) {
    const srcPath = path.join(backupDir, rel);
    const destPath = path.resolve(rel);
    if (fs.existsSync(srcPath)) {
      console.log(`Copying ${rel} from backup...`);
      copyRecursiveSync(srcPath, destPath);
    } else {
      console.warn(`Warning: path ${rel} does not exist in backup`);
    }
  }
}

// Steps definition
const steps = [
  {
    message: "Initial commit: README and setup scripts",
    files: [
      "README.md",
      "GETTING_STARTED.md",
      "IMPLEMENTATION_CHECKLIST.md",
      "setup-db.sh",
      "start.sh",
      ".gitignore"
    ]
  },
  {
    message: "Database: Add initial schema definition",
    files: [
      "database/schema.sql"
    ]
  },
  {
    message: "Backend: Project structure, package.json, and tsconfig",
    files: [
      "backend/package.json",
      "backend/package-lock.json",
      "backend/tsconfig.json",
      "backend/.env.example",
      "backend/.env",
      "backend/.sequelizerc"
    ]
  },
  {
    message: "Backend: Add database connection config and helper utilities",
    files: [
      "backend/config/sequelize-cli.cjs",
      "backend/src/config/database.ts",
      "backend/src/config/database.js",
      "backend/src/constants",
      "backend/src/utils"
    ]
  },
  {
    message: "Backend: Add migrations for core schema",
    files: [
      "backend/migrations/20260605000000-core-schema.cjs",
      "backend/migrations/20260605002000-add-notifications-table.cjs",
      "backend/migrations/20260605004000-create-roles-table.cjs"
    ]
  },
  {
    message: "Backend: Add initial seed data",
    files: [
      "backend/seeders/20260605000900-roles.cjs",
      "backend/seeders/20260605001000-demo-data.cjs"
    ]
  },
  {
    message: "Backend: Add base models (User, Patient, TestCategory)",
    files: [
      "backend/src/models/User.ts",
      "backend/src/models/Patient.ts",
      "backend/src/models/TestCategory.ts"
    ]
  },
  {
    message: "Backend: Add core models (Test, Sample, SampleTest)",
    files: [
      "backend/src/models/Test.ts",
      "backend/src/models/Sample.ts",
      "backend/src/models/SampleTest.ts"
    ]
  },
  {
    message: "Backend: Add Result and Invoice models",
    files: [
      "backend/src/models/Result.ts",
      "backend/src/models/Invoice.ts",
      "backend/src/models/InvoiceItem.ts",
      "backend/src/models/InvoicePayment.ts",
      "backend/src/models/Notification.ts",
      "backend/src/models/index.ts"
    ]
  },
  {
    message: "Backend: Add authentication middleware and controllers",
    files: [
      "backend/src/middleware/auth.ts",
      "backend/src/controllers/authController.ts",
      "backend/src/routes/auth.ts",
      "backend/src/validators/auth.ts"
    ]
  },
  {
    message: "Backend: Add test and category controllers/routes",
    files: [
      "backend/src/controllers/testController.ts",
      "backend/src/routes/tests.ts",
      "backend/src/validators/test.ts"
    ]
  },
  {
    message: "Backend: Add sample and sample test controllers/routes",
    files: [
      "backend/src/controllers/sampleController.ts",
      "backend/src/routes/samples.ts",
      "backend/src/validators/sample.ts"
    ]
  },
  {
    message: "Backend: Add results controller, routes, and validation",
    files: [
      "backend/src/controllers/resultController.ts",
      "backend/src/routes/results.ts",
      "backend/src/validators/result.ts"
    ]
  },
  {
    message: "Backend: Add invoices and payments tracking",
    files: [
      "backend/src/controllers/invoiceController.ts",
      "backend/src/routes/invoices.ts",
      "backend/src/validators/invoice.ts"
    ]
  },
  {
    message: "Backend: Add reports dashboard endpoint",
    files: [
      "backend/src/controllers/reportController.ts",
      "backend/src/routes/reports.ts",
      "backend/src/index.ts",
      "backend/src/types"
    ]
  },
  {
    message: "Frontend: Project scaffolding (Vite, Tailwind, Tsconfig)",
    files: [
      "frontend/package.json",
      "frontend/package-lock.json",
      "frontend/tsconfig.json",
      "frontend/tsconfig.node.json",
      "frontend/vite.config.ts",
      "frontend/tailwind.config.ts",
      "frontend/postcss.config.cjs",
      "frontend/index.html",
      "frontend/public"
    ]
  },
  {
    message: "Frontend: Add core services and API client",
    files: [
      "frontend/src/vite-env.d.ts",
      "frontend/src/main.tsx",
      "frontend/src/types",
      "frontend/src/constants",
      "frontend/src/utils",
      "frontend/src/services"
    ]
  },
  {
    message: "Frontend: Add State management (Auth store)",
    files: [
      "frontend/src/store",
      "frontend/src/hooks"
    ]
  },
  {
    message: "Frontend: Add common Form components and layout elements",
    files: [
      "frontend/src/components",
      "frontend/src/styles"
    ]
  },
  {
    message: "Frontend: Add Home Page and Login Page",
    files: [
      "frontend/src/pages/HomePage.tsx",
      "frontend/src/pages/LoginPage.tsx",
      "frontend/src/App.tsx"
    ]
  },
  {
    message: "Frontend: Add Dashboard layout and navigation configuration",
    files: [
      "frontend/src/config",
      "frontend/src/pages/DashboardPage.tsx"
    ]
  },
  {
    message: "Frontend: Add Patient intake and Reception Desk view",
    files: [
      "frontend/src/pages/reception"
    ]
  },
  {
    message: "Frontend: Add Lab queue and result entry pages",
    files: [
      "frontend/src/pages/lab"
    ]
  },
  {
    message: "Frontend: Add Doctor approvals and patient views",
    files: [
      "frontend/src/pages/doctor",
      "frontend/src/pages/patient"
    ]
  },
  {
    message: "Production readiness: Security hardening and clean database migrations",
    files: [
      "database/migrations/001_add_clinical_fields.sql",
      "backend/migrations/20260607000000-add-payment-tracking-and-sample-fields.cjs",
      "backend/migrations/20260607001000-add-clinical-fields.cjs",
      "docs"
    ]
  }
];

// Append the github string requested by user
try {
  fs.appendFileSync(path.resolve('README.md'), '\n# smartlab\n');
} catch (e) {
  console.error("Could not append to README.md", e);
}

// Phase 1: Move items to backup
console.log("Creating backup directory...");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const itemsToBackup = fs.readdirSync(path.resolve('.')).filter((item) => {
  return item !== '_temp_git_split_backup' && item !== 'git_split.js' && item !== '.git';
});

console.log("Moving files to backup...");
for (const item of itemsToBackup) {
  const src = path.resolve(item);
  const dest = path.join(backupDir, item);
  fs.renameSync(src, dest);
}

// Phase 2: Initialize Git and run commits
console.log("Initializing git repository...");
try {
  execSync('git init', { stdio: 'inherit' });
  execSync('git config user.name "kculz"', { stdio: 'inherit' });
  execSync('git config user.email "kculz@users.noreply.github.com"', { stdio: 'inherit' });
} catch (err) {
  console.error("Failed to initialize git repository", err);
}

for (let i = 0; i < steps.length; i++) {
  const step = steps[i];
  console.log(`\n--- Executing Step ${i + 1}/${steps.length}: "${step.message}" ---`);
  copyFromBackup(step.files);
  try {
    execSync('git add -A', { stdio: 'inherit' });
    execSync(`git commit -m "${step.message}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to commit step ${i + 1}`, err);
  }
}

// Phase 3: Setup remote & branch & push
console.log("\nSetting up branch main and remote...");
try {
  execSync('git branch -M main', { stdio: 'inherit' });
  // Remove existing origin just in case
  try {
    execSync('git remote remove origin', { stdio: 'ignore' });
  } catch (e) {}
  execSync('git remote add origin https://github.com/kculz/smartlab.git', { stdio: 'inherit' });
  console.log("Attempting to push to remote...");
  execSync('git push -u origin main', { stdio: 'inherit' });
} catch (err) {
  console.error("Failed to push to GitHub. You might need to authenticate manually in the terminal.", err);
}

// Phase 4: Clean up
console.log("\nCleaning up backup folder...");
fs.rmSync(backupDir, { recursive: true, force: true });
console.log("Done!");
