/**
 * Git Commit Tool
 *
 * Analyze staged changes, determine commit type, generate conventional commit message.
 * Returns commands to execute.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import * as path from "path"
import * as fs from "fs"
import { execSync } from "child_process"

const gitCommitTool: ToolDefinition = tool({
  description:
    "Analyze staged changes, determine commit type, generate conventional commit message. Returns shell commands to execute.",
  args: {
    message: tool.schema.string().optional().describe("Optional commit message override"),
    push: tool.schema.boolean().optional().describe("Push to remote after commit (default: false)"),
  },
  async execute(args, context) {
    const { message: userMessage, push } = args
    const cwd = context.worktree || context.directory

    const gitDir = path.join(cwd, ".git")
    if (!fs.existsSync(gitDir)) {
      return JSON.stringify({ error: "Not a git repository", cwd })
    }

    // Get only changed files from staged diff
    let changedFiles: string[] = []
    try {
      const output = execSync("git diff --cached --name-only", { cwd, encoding: "utf-8" }).trim()
      changedFiles = output ? output.split("\n") : []
    } catch {
      // No staged changes
    }

    if (changedFiles.length === 0) {
      return JSON.stringify({ error: "No staged changes to commit", cwd })
    }

    // Analyze each changed file
    const fileChanges = changedFiles.map((file) => {
      const ext = path.extname(file).toLowerCase()
      const dir = path.dirname(file).toLowerCase()
      const base = path.basename(file).toLowerCase()

      const isTest = /\.(test|spec)\./i.test(file) || /^test[\/\\]/i.test(file) || /^__tests__[\/\\]/i.test(file)
      const isDoc = /\.(md|mdx|txt|rst)$/i.test(file) || /^docs?[\/\\]/i.test(dir) || /^readme/i.test(base)
      const isConfig = /\.(json|toml|yaml|yml)$/i.test(file) || /\.(config|rc)$/i.test(file)
      const isCI = /^\.github[\/\\]/i.test(file) || /^\.circleci[\/\\]/i.test(file) || /^jenkinsfile$/i.test(base)
      const isStyle = /\.(css|scss|sass|less|tailwind)$/i.test(ext)
      const isBuild = /^(webpack|vite|rollup|babel|esbuild|tsup)/i.test(base)

      return { file, ext, isTest, isDoc, isNew: true, isConfig, isCI, isStyle, isBuild }
    })

    // Determine commit type with priority ordering
    // Priority: feat > fix > perf > refactor > test > docs > ci > chore
    let type = "chore"
    const hasCode = fileChanges.some((f) => !f.isDoc && !f.isConfig && !f.isCI)
    const hasNewFiles = fileChanges.some((f) => f.isNew && !f.isConfig && !f.isDoc && !f.isTest)

    if (fileChanges.every((f) => f.isCI)) {
      type = "ci"
    } else if (fileChanges.every((f) => f.isDoc)) {
      type = "docs"
    } else if (fileChanges.every((f) => f.isTest)) {
      type = "test"
    } else if (hasNewFiles && hasCode) {
      type = "feat"
    } else if (fileChanges.some((f) => f.ext === ".ts" || f.ext === ".tsx" || f.ext === ".js" || f.ext === ".jsx")) {
      type = "fix"
    } else if (hasCode) {
      type = "refactor"
    }

    const summary = type === "feat" ? "add new feature" : type === "fix" ? "fix issue" : `${type} changes`

    const commitMsg = userMessage || `${type}: ${summary}`

    const commands = [
      "# Stage all changes",
      "git add -A",
      "",
      "# Commit with conventional format",
      `git commit -m "${commitMsg}"`,
    ]

    if (push) {
      commands.push("", "# Push to remote", "git push")
    }

    const script = commands.join("\n")

    return JSON.stringify({
      instructions: "Execute these commands in sequence:",
      script,
      commitMessage: commitMsg,
      type,
      changedFiles,
      fileCount: changedFiles.length,
      note: "Review the staged files with 'git diff --cached' before committing",
    })
  },
})

export default gitCommitTool
