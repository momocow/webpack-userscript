#!/usr/bin/env node

const path = require('path')

const binIdx = process.argv.indexOf(__filename)

if (binIdx + 1 >= process.argv.length) {
  console.error()
  process.exit(1)
} else {
  const targetPath = path.resolve(process.cwd(), process.argv[binIdx + 1])
}
