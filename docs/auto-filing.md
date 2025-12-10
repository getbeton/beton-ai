# 🤖 The Auto-Renaming System

We use automation to keep our file names clean and organized.

## How it works

1. **Create**: Create a file in `projects/` or `templates/` with any name (e.g., `projects/new-idea.md`).
2. **Push**: Commit and push your changes to GitHub.
3. **Magic**: The system will automatically rename your file to match our convention.
    * `projects/new-idea.md` -> `projects/2025-12-10-001-new-idea.md`

> [!IMPORTANT]
> **Files will change names!**
> After you push, the file on GitHub is renamed. **You MUST run "Pull"** to get the renamed file back on your computer. If you don't, you might get confused or create duplicates.

## Obsidian Users

If you use Obsidian with our config, files created via the "Create New Zettel" button are already named correctly, so the system won't touch them.
