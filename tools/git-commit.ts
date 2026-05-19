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
      // No staged changes yet
    }

    // Analyze only changed files to determine commit type
    const fileChanges = changedFiles.map((file) => {
      const ext = path.extname(file)
      const isTest = /\.(test|spec)\./.test(file) || file.startsWith("test/") || file.startsWith("__tests__/")
      const isDoc = /\.(md|txt|rst)$/.test(file) || file.startsWith("docs/")
      const isNew = !fs.existsSync(path.join(cwd, file)) || changedFiles.includes(file)
      const isConfig = /\.(json|toml|yaml|yml|config)$/.test(file)

      return { file, ext, isTest, isDoc, isNew, isConfig }
    })

    // Determine type from changed files only
    let type = "chore"
    if (fileChanges.some((f) => f.isTest)) {
      type = "test"
    } else if (fileChanges.every((f) => f.isDoc)) {
      type = "docs"
    } else if (fileChanges.some((f) => f.isNew && !f.isConfig && !f.isDoc)) {
      type = "feat"
    } else if (fileChanges.some((f) => f.ext === ".ts" || f.ext === ".js")) {
      type = "fix"
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
      note: "Review the staged files with 'git diff --cached' before committing",
    })
  },
})

export default gitCommitTool
