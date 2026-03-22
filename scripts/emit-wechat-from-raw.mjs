import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const seeds = path.join(root, 'public', 'seeds')

const parts = ['wechat-body-part1.raw', 'wechat-body-part2.raw']
  .map((f) => path.join(seeds, f))
  .filter((p) => fs.existsSync(p))

if (parts.length === 0) {
  console.error('Missing public/seeds/wechat-body-part*.raw')
  process.exit(1)
}

const body = parts.map((p) => fs.readFileSync(p, 'utf8')).join('\n\n')
const out = path.join(root, 'lib', 'seed-wechat-generated.ts')
fs.writeFileSync(
  out,
  `/* 由 scripts/emit-wechat-from-raw.mjs 根据 public/seeds/wechat-body-part*.raw 生成 */\nexport const SEED_WECHAT_USER_NOTES = ${JSON.stringify(body)}\n`,
  'utf8'
)
console.log('OK', out, 'length', body.length)
