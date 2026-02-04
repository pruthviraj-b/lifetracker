export const WebDatabasesCourseData = {
    habit: {
        title: "Full Stack: Web & Databases",
        category: "learning",
        timeOfDay: "anytime",
        frequency: [0, 1, 2, 3, 4, 5, 6],
        type: "goal",
        goalDuration: 75,
        goalProgress: 0,
        streak: 0,
        archived: false,
        priority: "medium"
    },
    note: {
        title: "🌐 Full Stack Engineering Roadmap",
        content: `# Full Stack: Web & Databases

**Goal**: Build scalable web applications using MERN Stack and SQL.
**Focus**: Database Design, API Development, and Frontend Integration.

---

## 🗄️ Module 1: Database Fundamentals (SQL & NoSQL)

### Day 1: Relational Databases (SQL)
**Objective**: Understanding Tables, Rows, and Columns.

**Key Concepts**:
- Primary Key vs Foreign Key
- Normalization (1NF, 2NF, 3NF)
- ACID Properties

### Day 2: Advanced SQL Queries
**Objective**: Joins and Aggregations.

\`\`\`sql
SELECT users.name, orders.amount 
FROM users 
JOIN orders ON users.id = orders.user_id
WHERE orders.amount > 100;
\`\`\`

### Day 3: NoSQL & MongoDB
**Objective**: Document-based storage.

How MongoDB differs from SQL.
- Flexible Schema
- JSON-like documents (BSON)
- Horizontal Scaling (Sharding)

### Day 4: MongoDB One-to-Many
**Objective**: Modeling relationships in NoSQL.

Embedding vs Referencing.
\`\`\`json
// Embedding
{
  "name": "John",
  "addresses": [
    { "city": "New York" },
    { "city": "London" }
  ]
}
\`\`\`

---

## 🚀 Module 2: Backend Development (Node.js & Express)

### Day 10: Node.js Logic
**Objective**: JavaScript runtime environment.

Non-blocking I/O and the Event Loop.

### Day 11: REST API with Express
**Objective**: Building JSON APIs.

\`\`\`javascript
const express = require('express');
const app = express();

app.get('/api/users', (req, res) => {
    res.json([{ id: 1, name: 'John' }]);
});

app.listen(3000);
\`\`\`

---

## ⚛️ Module 3: Frontend (React & Integration)

### Day 25: React Components
**Objective**: Building UI with JSX.

### Day 26: State Management
**Objective**: useState and useEffect hooks.

\`\`\`javascript
const [count, setCount] = useState(0);

useEffect(() => {
    document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

### Day 30: Fetching Data
**Objective**: Connecting Frontend to Backend.

Using \`fetch\` or \`axios\` to consume your Express API.

---

## 🛠️ Module 4: Deployment & DevOps

### Day 50: CI/CD Pipelines
**Objective**: Automating builds.

### Day 55: Docker
**Objective**: Containerization.

Writing a \`Dockerfile\` for your Node.js application.

---

## 📚 Top Resources
1. **[MongoDB University](https://university.mongodb.com/)** - Free expert courses.
2. **[React.dev](https://react.dev/)** - The official React documentation.
3. **[PostgreSQL Docs](https://www.postgresql.org/docs/)** - Best open source SQL DB.
`,
        category: "learning",
        color: "#f59e0b", // Amber/Yellow
        isPinned: false,
        type: "standalone"
    }
};
