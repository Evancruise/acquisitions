#!/usr/bin/env node

/**
 * Quick Start Script for Development Environment
 * This script helps developers get started quickly with the Dockerized Neon setup
 */

import { execSync, spawnSync } from "child_process";
import fs from "fs";
import readline from "readline";

// Helper to run shell commands safely
function run(command, options = {}) {
  try {
    return execSync(command, { stdio: "pipe", ...options }).toString();
  } catch (err) {
    console.error(`❌ Command failed: ${command}`);
    process.exit(1);
  }
}

console.log("🚀 Starting Dockerized Application with Neon Database (Development)");
console.log("================================================================");

// Check if Docker is running
try {
  run("docker info");
} catch {
  console.error("❌ Docker is not running. Please start Docker and try again.");
  process.exit(1);
}

// Check if environment file exists
if (!fs.existsSync(".env.development.local")) {
  console.warn("⚠️  Environment file .env.development.local not found!");
  console.log("📝 Creating template from .env.development...");
  if (fs.existsSync(".env.development")) {
    fs.copyFileSync(".env.development", ".env.development.local");
  } else {
    console.error("❌ No .env.development found. Please create .env.development.local manually.");
    process.exit(1);
  }

  console.log("\n🔧 Please edit .env.development.local with your Neon credentials:");
  console.log("   - NEON_API_KEY (from Neon Console)");
  console.log("   - NEON_PROJECT_ID (from Neon Console)");
  console.log("   - PARENT_BRANCH_ID (usually 'br-main-xxxxx')\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("Press Enter after updating the environment file...", () => rl.close());
}

console.log("🏗️  Building and starting development environment...");

// Pull latest Neon Local image
console.log("📦 Pulling latest Neon Local image...");
run("docker pull neondatabase/neon_local:latest");

// Build and start services
run("docker-compose -f docker-compose.dev.yml --env-file .env.development.local up -d");

console.log("\n⏳ Waiting for services to be healthy...");
const timeout = 60;
let elapsed = 0;

while (elapsed < timeout) {
  const psOutput = run("docker-compose -f docker-compose.dev.yml ps");
  if (psOutput.includes("Up (healthy)")) {
    console.log("✅ Services are healthy!");
    break;
  }
  console.log(`   Waiting... (${elapsed}/${timeout}s)`);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000); // sleep 3s
  elapsed += 3;
}

if (elapsed >= timeout) {
  console.warn("⚠️  Services are taking longer than expected to start.");
  console.log("📋 Check service status:");
  console.log(run("docker-compose -f docker-compose.dev.yml ps"));
  console.log("\n📋 Check logs for issues:");
  console.log("   docker-compose -f docker-compose.dev.yml logs");
  process.exit(1);
}

console.log("\n🎉 Development environment is ready!");
console.log("🌐 Application: http://localhost:3000");
console.log("🗄️  Database: postgres://user:password@localhost:5432/dbname\n");

console.log("📋 Useful commands:");
console.log("   📜 View logs: docker-compose -f docker-compose.dev.yml logs -f");
console.log("   🛑 Stop: docker-compose -f docker-compose.dev.yml down");
console.log("   🔄 Restart: docker-compose -f docker-compose.dev.yml restart app\n");

console.log("📊 Service Status:");
console.log(run("docker-compose -f docker-compose.dev.yml ps"));

console.log("\n🔗 Opening application in browser...");
try {
  if (spawnSync("open", ["http://localhost:3000"]).status === 0) {
    // macOS
  } else if (spawnSync("xdg-open", ["http://localhost:3000"]).status === 0) {
    // Linux
  } else {
    console.log("   Please open http://localhost:3000 in your browser");
  }
} catch {
  console.log("   Please open http://localhost:3000 in your browser");
}
