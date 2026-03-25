import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const DOCS_DIR = join(process.cwd(), 'user-docs')

export async function loadDoc(slug: string): Promise<string> {
  const filePath = join(DOCS_DIR, `${slug}.mdx`)
  return readFile(filePath, 'utf-8')
}
