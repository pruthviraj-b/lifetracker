export const GitProjectsCourseData = {
    habit: {
        title: "Git Integration & Project Mgmt",
        category: "learning",
        timeOfDay: "anytime",
        frequency: [0, 1, 2, 3, 4, 5, 6],
        type: "goal",
        goalDuration: 30,
        goalProgress: 0,
        streak: 0,
        archived: false,
        priority: "medium"
    },
    note: {
        title: "🕹️ Git & Real World Projects",
        content: `# Git & Projects Mastery

**Goal**: Master Version Control and Agile Project Management.

---

## 🌲 Module 1: The Git Workflow

### Day 1: Git Basics
**Objective**: Init, Add, Commit.

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
\`\`\`

### Day 2: Branching & Merging
**Objective**: Parallel development.

\`\`\`bash
git checkout -b feature-login
# work work work
git checkout main
git merge feature-login
\`\`\`

### Day 3: Analyzing History
**Objective**: Git Log and Diff.

---

## 🚀 Module 2: Agile & Jira

### Day 10: Scrum Methodology
**Objective**: Sprints, Standups, and Retrospectives.

### Day 11: Kanban Boards
**Objective**: Visualizing work in progress.

---

## 🏗️ Module 3: Capstone Projects

### Day 15: Project 1 - Task Manager
**Stack**: React + Firebase.
**Goal**: CRUD application with authentication.

### Day 25: Project 2 - E-Commerce Store
**Stack**: MERN.
**Goal**: Shopping cart, Stripe payment, and Admin dashboard.

---

## 📚 Resources
1. **[Pro Git Book](https://git-scm.com/book/en/v2)** - Free official book.
2. **[Atlassian Agile Guide](https://www.atlassian.com/agile)** - Scrum/Kanban tutorials.
`,
        category: "learning",
        color: "#f97316", // Orange
        isPinned: false,
        type: "standalone"
    }
};
