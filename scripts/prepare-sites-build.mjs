import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const serverDirectory = path.join(root, 'dist', 'server')

fs.mkdirSync(serverDirectory, { recursive: true })
fs.copyFileSync(path.join(root, 'worker', 'index.js'), path.join(serverDirectory, 'index.js'))
console.log('Sites worker prepared')
