#!/usr/bin/env node
'use strict'

// Wait for prochat_db to become available by attempting a simple SELECT 1
// Usage: set env DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, DB_CONNECT_RETRIES, DB_CONNECT_RETRY_DELAY_MS

const DEFAULT_RETRIES = 30
const DEFAULT_DELAY_MS = 2000

const retries = parseInt(process.env.DB_CONNECT_RETRIES || process.env.DB_CONNECT_RETRIES || DEFAULT_RETRIES, 10)
const delayMs = parseInt(process.env.DB_CONNECT_RETRY_DELAY_MS || process.env.DB_CONNECT_RETRY_DELAY_SEC && (parseInt(process.env.DB_CONNECT_RETRY_DELAY_SEC,10)*1000) || DEFAULT_DELAY_MS, 10)

const DB_USER = process.env.DB_USER || 'prochatadmin'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10)
const DB_NAME = process.env.DB_NAME || 'prochat_db'

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

async function checkWithPg() {
  try {
    const { Client } = require('pg')
    const client = new Client({
      user: DB_USER,
      password: DB_PASSWORD,
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      connectionTimeoutMillis: 2000
    })
    await client.connect()
    const res = await client.query('SELECT 1')
    await client.end()
    return res && res.rowCount === 1
  } catch (err) {
    // console.debug('pg check failed:', err && err.message)
    return false
  }
}

async function main() {
  console.log(`wait_for_prochat_db: checking ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME} (retries=${retries} delayMs=${delayMs})`)
  for (let i = 1; i <= retries; i++) {
    const ok = await checkWithPg()
    if (ok) {
      console.log(`Database ${DB_NAME} available (attempt ${i})`)
      process.exit(0)
    }
    console.log(`Attempt ${i}/${retries} failed; waiting ${delayMs}ms...`)
    await sleep(delayMs)
  }
  console.error(`Timeout: ${DB_NAME} did not become available after ${retries} attempts`)
  process.exit(2)
}

main()
