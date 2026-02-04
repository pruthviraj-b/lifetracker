export const PythonCourseData = {
  habit: {
    title: "Python Mastery: The Complete System",
    category: "learning",
    timeOfDay: "anytime",
    frequency: [0, 1, 2, 3, 4, 5, 6],
    type: "goal",
    goalDuration: 120,
    goalProgress: 0,
    streak: 0,
    archived: false,
    priority: "high"
  },
  note: {
    title: "🐍 Python Full Stack & Data Science Syllabus",
    content: `# Python Mastery: The Complete System

**Goal**: From Zero to Architect. Master Python, Data Science, ML, DSA, and Databases.

---

## 🏗️ Module 1: Python Core Foundations (Days 1-7)

### Day 1: Python Intro & Syntax
**Objective**: Understand what Python is and write your first program.

### What is Python?
Python is a popular programming language created by Guido van Rossum, and released in 1991. It is used for:
- Web Development (server-side)
- Software Development
- Mathematics
- System Scripting

### Why Python?
- **Simple Syntax**: Readable and essentially English-like.
- **Versatile**: Used in AI, Data Science, Web, and Automation.
- **Interpreted**: Code is executed line by line.

### Your First Program
To print text in Python, use the \`print()\` function.

\`\`\`python
print("Hello, World!")
\`\`\`

---

### Day 2: Variables & Data Types
**Objective**: Learn how to store data.

### Variables
Variables are containers for storing data values. Python has no command for declaring a variable. A variable is created the moment you first assign a value to it.

\`\`\`python
x = 5
y = "John"
print(x)
print(y)
\`\`\`

### Data Types
Built-in Data Types in Python:
- **Text Type**: \`str\`
- **Numeric Types**: \`int\`, \`float\`, \`complex\`
- **Sequence Types**: \`list\`, \`tuple\`, \`range\`
- **Mapping Type**: \`dict\`
- **Set Types**: \`set\`, \`frozenset\`
- **Boolean Type**: \`bool\`

---

### Day 5: Loops (For & While)
**Objective**: Iterating over sequences.

### While Loop
With the while loop we can execute a set of statements as long as a condition is true.

\`\`\`python
i = 1
while i < 6:
  print(i)
  i += 1
\`\`\`

### For Loop
A for loop is used for iterating over a sequence.

\`\`\`python
fruits = ["apple", "banana", "cherry"]
for x in fruits:
  print(x)
\`\`\`

---

## 🛠️ Module 2: Advanced Python Concepts (Days 8-14)

### Day 8: Functions & Lambda
**Objective**: Creating reusable code blocks.

\`\`\`python
def my_function(fname):
  print(fname + " Refsnes")

x = lambda a : a + 10
print(x(5)) # 15
\`\`\`

### Day 10: OOP - Classes & Objects
**Objective**: Introduction to Object Oriented Programming.

\`\`\`python
class Person:
  def __init__(self, name, age):
    self.name = name
    self.age = age

p1 = Person("John", 36)
print(p1.name)
\`\`\`

### Day 12: Modules & PIP
**Objective**: Using libraries.

\`\`\`python
import platform
x = platform.system()
print(x)
\`\`\`

---

## 🤖 Module 3: Automation & Scripting (Days 15-28)

### Day 15: File Handling
**Objective**: Reading and writing files.

\`\`\`python
f = open("demofile.txt", "r")
print(f.read())
f.close()
\`\`\`

### Day 18: Web Scraping with BeautifulSoup
**Objective**: Extracting data from websites.

\`\`\`python
import requests
from bs4 import BeautifulSoup

URL = "https://realpython.com/atom.xml"
page = requests.get(URL)
soup = BeautifulSoup(page.content, "xml")
\`\`\`

### Day 25: Selenium Automation
**Objective**: Browser automation.

Automating clicks, form filling, and testing.

---

## 🌐 Module 4: Web Development (Days 29-42)

### Day 30: Flask Basics
**Objective**: Building a minimal server.

\`\`\`python
from flask import Flask
app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello World!"

if __name__ == "__main__":
    app.run()
\`\`\`

### Day 35: Building an REST API
**Objective**: JSON endpoints.

---

## 📊 Module 5: Data Science & AI (Days 43-56)

### Day 43: NumPy
**Objective**: High performance arrays.

\`\`\`python
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
\`\`\`

### Day 46: Pandas DataFrames
**Objective**: Data manipulation.

\`\`\`python
import pandas as pd
df = pd.read_csv('data.csv')
print(df.head())
\`\`\`

### Day 50: Matplotlib
**Objective**: Visualizing data.

\`\`\`python
import matplotlib.pyplot as plt
import numpy as np

xpoints = np.array([0, 6])
ypoints = np.array([0, 250])

plt.plot(xpoints, ypoints)
plt.show()
\`\`\`

---

## 🎓 Module 6: Capstone Project (Days 57-60)

### Day 57: Planning the Project
**Objective**: Architecture and Design.

### Day 60: Final Deployment
**Objective**: Deploying to Render/Heroku.

---

## 📚 Top Curated Resources
1. **[Python Official Docs](https://docs.python.org/3/)** - The source of truth.
2. **[Real Python](https://realpython.com/)** - Best tutorials.
3. **[Automate the Boring Stuff](https://automatetheboringstuff.com/)** - Best for automation.
`,
    category: "learning",
    color: "#3b82f6",
    isPinned: true,
    type: "standalone"
  }
};
