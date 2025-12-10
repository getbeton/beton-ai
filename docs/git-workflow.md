# 🔄 How We Manage Changes (The Git Workflow)

In this team, we don't just "Save" files. We use a system that allows many people to work on the same library of documents simultaneously without chaos. This system is called **Git**.

## 🧐 Why do we do this? (The "Why")

Imagine a shared Excel file on a legacy network drive.

1. **The "Overwrite" Problem**: If you and I open it at the same time, the last person to save wipes out the other's work.
2. **The "Mystery" Problem**: Someone deletes a slide, and nobody knows who did it or why.
3. **The "Undo" Problem**: We realize the strategy from 3 months ago was actually better, but that file is gone forever.

**Git fixes all of this.**

* It saves **History** (Snapshots), not just the current file.
* It forces us to leave a **Note** explaining every change.
* It intelligently **Merges** work from different people so we can work in parallel.

---

## 🛠 The Workflow: The "Life Cycle" of an Edit

To keep everything running smoothly, we follow a strict loop. Think of it like a conversation: **Listen (Pull) -> Think (Edit) -> Speak (Commit) -> Share (Push)**.

### Step 1: Sync with the Team ("Pull")

**Concept**: Before you start writing, you must ensure you have the latest information. It's like checking your email before starting your day to make sure you aren't working on outdated tasks.

* **Why?** If you edit an old version of a document, you might undo work someone else finished 5 minutes ago.
* **How**: click **"Pull"** or **"Sync"** in Antigravity.

### Step 2: Make Your Changes ("Edit")

**Concept**: Open the files on your computer and type away.

* **Note**: You are currently working in your own private sandbox. No one else can see this yet. You can make mistakes, delete things, and experiment freely.

### Step 3: Save a Snapshot ("Commit")

**Concept**: This is the most crucial step. A "Commit" is not just hitting `Ctrl+S`. It is creating a permanent "Checkpoint" in history.

* **Why?** If we ever need to go back, we need to know what this checkpoint represents.
* **How**:
    1. Antigravity will show you the files you changed.
    2. You **MUST** write a **Commit Message**.
        * ❌ *Bad*: "Update"
        * ✅ *Good*: "Added Q3 revenue targets to the Finance deck"
    3. Click **"Commit"**.

### Step 4: Publish to the Team ("Push")

**Concept**: You've saved the snapshot on your laptop (Committed), but the rest of the team can't see it yet. "Pushing" uploads your new history to the central cloud.

* **Why?** This makes your work official and available to everyone else.
* **How**: Click **"Push"**.

---

## 🔀 Merging and "Conflicts"

What happens if you and a colleague edit the *exact same sentence* at the *exact same time*?

In the old days, one of you would overwrite the other. In our system, the computer raises its hand and says: **"I have a Conflict."**

### How to handle a Conflict

It sounds scary, but it's actually a safety feature. Antigravity will pause and show you both versions:

* **Incoming Change**: What your colleague wrote.
* **Current Change**: What you wrote.

You simply have to choose:

1. "Keep my version."
2. "Keep their version."
3. "Keep both" (and edit them to make sense).

Once you pick the winner, you "Commit" the result. This is called **Merging**.
