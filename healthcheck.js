#!/usr/bin/env node

/**
 * Health Check Script for Docker Container
 * This script is used by Docker's HEALTHCHECK instruction
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';
const HEALTH_PATH = '/health';
const TIMEOUT = parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000;

const options = {
  host: HOST,
  port: PORT,
  path: HEALTH_PATH,
  timeout: TIMEOUT,
  method: 'GET'
};

console.log(`Health check: ${HOST}:${PORT}${HEALTH_PATH}`);

const request = http.request(options, (res) => {
  console.log(`Health check response: ${res.statusCode}`);
  
  if (res.statusCode >= 200 && res.statusCode < 300) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.error(`Health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (error) => {
  console.error('Health check failed with error:', error.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('Health check timed out');
  request.destroy();
  process.exit(1);
});

request.setTimeout(TIMEOUT);
request.end();