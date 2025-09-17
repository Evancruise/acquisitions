#!/usr/bin/env node

/**
 * Quick Start Script for Production Environment
 * This script helps deploy the Dockerized application using Neon Cloud Database
 */

import { execSync, spawnSync } from "child_process";
import fs from "fs";
import readline from "readline";

function run(command, options = {}) {
  try {
    return execSync(command, { stdio: "pipe", ...options }).toString();
  } catch (err) {
    console.error(`❌ Command failed: ${command}`);
    process.exit(1);
  }
}

console.log("🚀 Starting Dockerized Application with Neon Database (Production)");
console.log("================================================================");

// Check if Docker is running
try {
  run("docker info");
} catch {
  console.error("❌ Docker is not running. Please start Docker and try again.");
  process.exit(1);
}

// Check if production environment file exists
if (!fs.existsSync(".env.production")) {
  console.warn("⚠️  Environment file .env.production not found!");
  console.log("📝 Creating template from .env.production.example (if exists)...");
  if (fs.existsSync(".env.production.example")) {
    fs.copyFileSync(".env.production.example", ".env.production");
  } else {
    console.error("❌ No .env.production.example found. Please create .env.production manually.");
    process.exit(1);
  }

  console.log("\n🔧 Please edit .env.production with your Neon Cloud credentials:");
  console.log(" - DATABASE_URL (from Neon Console, usually postgresql://...)\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("Press Enter after updating the environment file...", () => rl.close());
}

console.log("🏗️ Building and starting production environment...");
run("docker-compose -f docker-compose.prod.yml --env-file .env.production up -d");

console.log("\n⏳ Waiting for services to be healthy...");
const timeout = 60;
let elapsed = 0;

while (elapsed < timeout) {
  const psOutput = run("docker-compose -f docker-compose.prod.yml ps");
  if (psOutput.includes("Up (healthy)")) {
    console.log("✅ Services are healthy!");
    break;
  }
  console.log(` Waiting... (${elapsed}/${timeout}s)`);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000); // sleep 3s
  elapsed += 3;
}

if (elapsed >= timeout) {
  console.warn("⚠️ Services are taking longer than expected to start.");
  console.log("📋 Check service status:");
  console.log(run("docker-compose -f docker-compose.prod.yml ps"));
  console.log("\n📋 Check logs for issues:");
  console.log(" docker-compose -f docker-compose.prod.yml logs");
  process.exit(1);
}

console.log("\n🎉 Production environment is ready!");
console.log("🌐 Application: http://localhost:3000\n");

console.log("📋 Useful commands:");
console.log(" 📜 View logs: docker-compose -f docker-compose.prod.yml logs -f");
console.log(" 🛑 Stop: docker-compose -f docker-compose.prod.yml down");
console.log(" 🔄 Restart: docker-compose -f docker-compose.prod.yml restart app\n");

console.log("📊 Service Status:");
console.log(run("docker-compose -f docker-compose.prod.yml ps"));

console.log("\n🔗 Opening application in browser...");
try {
  if (spawnSync("open", ["http://localhost:3000"]).status === 0) {
    // macOS
  } else if (spawnSync("xdg-open", ["http://localhost:3000"]).status === 0) {
    // Linux
  } else {
    console.log(" Please open http://localhost:3000 in your browser");
  }
} catch {
  console.log(" Please open http://localhost:3000 in your browser");
}
