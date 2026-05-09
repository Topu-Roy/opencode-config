/**
 * Git Commit Tool
 *
 * Stage changes, analyze diff, determine type, generate conventional commit message, commit.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

const gitCommitTool: ToolDefinition = tool({
  description:
    "Stage changes, analyze diff, determine commit type, generate conventional commit message, and commit",
  args: {
    message: tool.schema.string().optional().describe("Optional commit message override"),
    push: tool.schema.boolean().optional().describe("Push to remote after commit (default: false)"),
  },
  async execute(args, context) {
    const { message: userMessage, push } = args

    const $ = context.$
    let result = ""

    try {
      const branch = await $`git branch --show-current`.text()
      const branchName = branch.trim()

      await $`git add -A`

      const diffStat = await $`git diff --cached --stat`.text()
      const diffFull = await $`git diff --cached`.text()

      if (!diffStat.trim()) {
        return JSON.stringify({
          error: "No staged changes to commit",
          branch: branchName,
        })
      }

      const files = diffStat.trim().split("\n").map((l) => l.split("|")[0]?.trim()).filter(Boolean)
      const fileCount = files.length

      let type = "chore"
      const exts = new Set<string>()
      const newFiles: string[] = []
      const modifiedFiles: string[] = []

      for (const f of files) {
        const ext = f.split(".").pop() || ""
        exts.add(ext)

        const status = await $`git diff --cached -- "${f}"`.text()
        const isNew = status.startsWith("diff --git") && status.includes("new file")
        if (isNew) {
          newFiles.push(f)
        } else {
          modifiedFiles.push(f)
        }
      }

      if (newFiles.some((f) => f.includes("test") || f.includes(".test.") || f.includes(".spec."))) {
        type = "test"
      } else if (newFiles.length > 0 && (exts.has("ts") || exts.has("js") || exts.has("tsx") || exts.has("jsx"))) {
        type = "feat"
      } else if (modifiedFiles.some((f) => f.includes("fix") || f.includes("bug"))) {
        type = "fix"
      } else if (files.every((f) => f.endsWith(".md") || f.endsWith(".txt") || f.endsWith(".rst"))) {
        type = "docs"
      } else if (files.some((f) => f.includes(".github") || f.includes(".gitlab-ci") || f.includes("Dockerfile"))) {
        type = "ci"
      } else if (files.some((f) => f.includes("package.json") || f.includes("requirements.txt") || f.includes("go.mod"))) {
        type = "chore"
      } else if (modifiedFiles.length > 0) {
        type = "fix"
      }

      let commitMessage = ""

      if (userMessage) {
        commitMessage = userMessage
      } else {
        const summary = generateSummary(files, type, newFiles.length, modifiedFiles.length)
        commitMessage = `${type}: ${summary}`
      }

      await $`git commit -m ${commitMessage}`

      const commitHash = await $`git log -1 --oneline`.text()
      const hash = commitHash.trim().split(" ")[0]

      result = JSON.stringify({
        success: true,
        branch: branchName,
        commit: hash,
        message: commitMessage,
        files: fileCount,
        type: type,
        stat: diffStat.trim(),
      })

      if (push) {
        await $`git push`
        result = JSON.stringify({
          ...JSON.parse(result),
          pushed: true,
        })
      }

      return result
    } catch (error: unknown) {
      const err = error as { message?: string }
      return JSON.stringify({
        error: err.message || "Commit failed",
      })
    }
  },
})

export default gitCommitTool

function generateSummary(files: string[], type: string, newCount: number, modCount: number): string {
  if (files.length === 1) {
    const f = files[0]
    const name = f.split("/").pop() || f
    return describeSingleFile(name, type)
  }

  const patterns = categorizeFiles(files)
  const parts: string[] = []

  if (patterns.has("auth") || patterns.has("login") || patterns.has("user")) {
    parts.push("auth")
  }
  if (patterns.has("api") || patterns.has("route")) {
    parts.push("API")
  }
  if (patterns.has("component") || patterns.has("ui")) {
    parts.push("UI")
  }
  if (patterns.has("test")) {
    parts.push("tests")
  }
  if (patterns.has("config")) {
    parts.push("config")
  }
  if (patterns.has("docs")) {
    parts.push("docs")
  }

  if (parts.length === 0) {
    return `${newCount + modCount} files updated`
  }

  return `${parts.join(", ")} updates`
}

function categorizeFiles(files: string[]): Set<string> {
  const categories = new Set<string>()
  const lower = files.map((f) => f.toLowerCase())

  for (const f of lower) {
    if (f.includes("auth") || f.includes("login") || f.includes("user") || f.includes("session")) categories.add("auth")
    if (f.includes("api") || f.includes("route") || f.includes("endpoint")) categories.add("api")
    if (f.includes("component") || f.includes("ui") || f.includes("button") || f.includes("modal")) categories.add("component")
    if (f.includes("test") || f.includes("spec")) categories.add("test")
    if (f.includes("config") || f.includes("json") || f.includes("yaml") || f.includes("toml")) categories.add("config")
    if (f.includes("readme") || f.includes("changelog") || f.includes("docs")) categories.add("docs")
  }

  return categories
}

function describeSingleFile(name: string, type: string): string {
  const clean = name.replace(/\.(ts|tsx|js|jsx|py|go|rs|java|swift)$/, "")

  const verbs: Record<string, string> = {
    feat: "add",
    fix: "fix",
    refactor: "refactor",
    docs: "update",
    test: "add tests for",
    chore: "update",
    perf: "optimize",
    ci: "update",
  }

  return `${verbs[type] || "update"} ${clean}`
}