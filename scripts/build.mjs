// Builds the package as both ESM and CommonJS.
//
// Node decides the module format of a .js file from the nearest package.json,
// so the CommonJS output gets its own `{"type": "commonjs"}` marker while the
// root package.json declares the package as ESM.
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tsc = process.platform === 'win32' ? 'tsc.cmd' : 'tsc'

rmSync(join(root, 'dist'), { recursive: true, force: true })

for (const project of ['tsconfig.json', 'tsconfig.cjs.json']) {
  execFileSync(join(root, 'node_modules', '.bin', tsc), ['-p', project], {
    cwd: root,
    stdio: 'inherit',
  })
}

mkdirSync(join(root, 'dist', 'cjs'), { recursive: true })
writeFileSync(
  join(root, 'dist', 'cjs', 'package.json'),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`
)

console.log('built dist/esm and dist/cjs')
