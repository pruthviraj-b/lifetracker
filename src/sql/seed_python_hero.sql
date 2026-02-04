-- Seed: Python Zero to Hero (60 Days)

DO $$
DECLARE
    course_id UUID;
    m1_id UUID;
    m2_id UUID;
    m3_id UUID;
    m4_id UUID;
BEGIN
    -- 1. Create Course
    INSERT INTO courses (title, description, thumbnail_url, difficulty_level, duration_weeks, tags, published)
    VALUES (
        'Python Zero to Hero',
        'A complete 60-day journey from absolute beginner to professional developer. Master the core, OOP, and build real-world apps.',
        'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=2664&auto=format&fit=crop',
        'Beginner',
        8,
        ARRAY['python', 'bootcamp', 'fullstack'],
        true
    ) RETURNING id INTO course_id;

    -- 2. Create Modules (Phases)

    -- Phase 1
    INSERT INTO modules (course_id, title, description, "order")
    VALUES (course_id, 'Phase 1: The Core (Days 1-15)', 'Mastering the syntax, variables, and control flow.', 0)
    RETURNING id INTO m1_id;

    -- Phase 2
    INSERT INTO modules (course_id, title, description, "order")
    VALUES (course_id, 'Phase 2: Logic & Architecture (Days 16-30)', 'Functions, modularity, and writing professional code.', 1)
    RETURNING id INTO m2_id;

    -- Phase 3
    INSERT INTO modules (course_id, title, description, "order")
    VALUES (course_id, 'Phase 3: The Hero Deep Dive (Days 31-45)', 'Object-Oriented Programming, advanced file handling, and memory management.', 2)
    RETURNING id INTO m3_id;

    -- Phase 4
    INSERT INTO modules (course_id, title, description, "order")
    VALUES (course_id, 'Phase 4: Ecosystem & Pro Skills (Days 46-60)', 'Databases, APIs, Testing, and the Final Capstone Project.', 3)
    RETURNING id INTO m4_id;

    -- 3. Insert Lessons

    -- PHASE 1 LESSONS
    INSERT INTO lessons (module_id, title, content, "order", duration_minutes) VALUES
    (m1_id, 'Day 1: Setup & Hello World', '# Objectives\n- Install Python 3.12+\n- Setup VS Code\n- Print "Hello World"', 0, 30),
    (m1_id, 'Day 2: Variables & Types', '# Objectives\n- Dynamic Typing\n- Naming Conventions\n- Strings vs Integers', 1, 45),
    (m1_id, 'Day 3: Numeric Types & Ops', '# Objectives\n- Integers, Floats\n- Bitwise Ops (AND, OR, XOR)', 2, 45),
    (m1_id, 'Day 4: Strings Mastery', '# Objectives\n- Slicing [start:stop:step]\n- F-Strings\n- Escape Characters', 3, 45),
    (m1_id, 'Day 5: Input & Casting', '# Objectives\n- input() function\n- Type casting (int(), str())', 4, 30),
    (m1_id, 'Day 6: Conditionals', '# Objectives\n- if, else, elif\n- Nested conditionals', 5, 45),
    (m1_id, 'Day 7: Logic & Ternary', '# Objectives\n- AND, OR, NOT\n- One-line if statements', 6, 45),
    (m1_id, 'Day 8: For Loops', '# Objectives\n- Iterating sequences\n- range() function\n- enumerate()', 7, 60),
    (m1_id, 'Day 9: While Loops', '# Objectives\n- while logic\n- Infinite loop prevention', 8, 45),
    (m1_id, 'Day 10: Loop Control', '# Objectives\n- break\n- continue\n- pass', 9, 30),
    (m1_id, 'Day 11: Lists Intro', '# Objectives\n- Mutability\n- Indexing & Slicing', 10, 45),
    (m1_id, 'Day 12: List Methods', '# Objectives\n- append, pop, sort\n- Nested Lists', 11, 45),
    (m1_id, 'Day 13: Tuples', '# Objectives\n- Immutability\n- Unpacking values', 12, 30),
    (m1_id, 'Day 14: Dictionaries', '# Objectives\n- Key-Value pairs\n- Nested Dicts\n- .get() method', 13, 60),
    (m1_id, 'Day 15: Sets', '# Objectives\n- Uniqueness\n- Union & Intersection', 14, 45);

    -- PHASE 2 LESSONS
    INSERT INTO lessons (module_id, title, content, "order", duration_minutes) VALUES
    (m2_id, 'Day 16: Functions 101', '# Objectives\n- def keyword\n- Return values\n- Parameters', 0, 45),
    (m2_id, 'Day 17: Args & Kwargs', '# Objectives\n- Variable arguments (*args)\n- Keyword args (**kwargs)', 1, 45),
    (m2_id, 'Day 18: Scope', '# Objectives\n- Global vs Local\n- nonlocal keyword', 2, 30),
    (m2_id, 'Day 19: Type Hinting', '# Objectives\n- PEP 484\n- Writing professional signatures', 3, 45),
    (m2_id, 'Day 20: Docstrings', '# Objectives\n- PEP 8\n- Documenting code', 4, 30),
    (m2_id, 'Day 21: Mini Project I', '# Task\nBuild a Command-line Task Manager using lists and loops.', 5, 120),
    (m2_id, 'Day 22: Comprehensions', '# Objectives\n- List Comprehensions\n- Dictionary Comprehensions', 6, 60),
    (m2_id, 'Day 23: Lambda Functions', '# Objectives\n- Anonymous functions\n- One-liners', 7, 30),
    (m2_id, 'Day 24: Recursion', '# Objectives\n- Base cases\n- Recursive calls', 8, 60),
    (m2_id, 'Day 25: Map, Filter, Reduce', '# Objectives\n- Functional programming tools', 9, 45),
    (m2_id, 'Day 26: Modules', '# Objectives\n- import, from, as\n- Custom modules', 10, 45),
    (m2_id, 'Day 27: Standard Library', '# Objectives\n- sys, os, platform', 11, 45),
    (m2_id, 'Day 28: Error Handling', '# Objectives\n- try, except, finally', 12, 45),
    (m2_id, 'Day 29: Custom Exceptions', '# Objectives\n- raise keyword\n- Custom exception classes', 13, 45),
    (m2_id, 'Day 30: Mini Project II', '# Task\nBuild a Math Quiz App with robust error logging.', 14, 120);

    -- PHASE 3 LESSONS
    INSERT INTO lessons (module_id, title, content, "order", duration_minutes) VALUES
    (m3_id, 'Day 31: File I/O', '# Objectives\n- Reading/Writing .txt\n- Context managers', 0, 45),
    (m3_id, 'Day 32: CSV & Excel', '# Objectives\n- csv module\n- Data handling', 1, 45),
    (m3_id, 'Day 33: JSON', '# Objectives\n- Parsing\n- Serialization', 2, 45),
    (m3_id, 'Day 34: OOP Intro', '# Objectives\n- Classes\n- Objects', 3, 60),
    (m3_id, 'Day 35: The Constructor', '# Objectives\n- __init__\n- self keyword', 4, 60),
    (m3_id, 'Day 36: Methods Types', '# Objectives\n- Instance vs Class vs Static methods', 5, 45),
    (m3_id, 'Day 37: Dunder Methods', '# Objectives\n- __str__, __repr__\n- __len__', 6, 45),
    (m3_id, 'Day 38: Inheritance', '# Objectives\n- Parent/Child classes\n- Overriding', 7, 60),
    (m3_id, 'Day 39: Multiple Inheritance', '# Objectives\n- Method Resolution Order (MRO)', 8, 60),
    (m3_id, 'Day 40: Encapsulation', '# Objectives\n- Private (__)\n- Protected (_)', 9, 45),
    (m3_id, 'Day 41: Closures', '# Objectives\n- Nested functions\n- Non-local state', 10, 60),
    (m3_id, 'Day 42: Decorators', '# Objectives\n- @wrappers\n- Modifying behavior', 11, 90),
    (m3_id, 'Day 43: Context Managers', '# Objectives\n- with statement\n- yield', 12, 60),
    (m3_id, 'Day 44: Memory Mgmt', '# Objectives\n- Deep vs Shallow Copy', 13, 45),
    (m3_id, 'Day 45: Iterators', '# Objectives\n- yield vs return\n- Generators', 14, 60);

    -- PHASE 4 LESSONS
    INSERT INTO lessons (module_id, title, content, "order", duration_minutes) VALUES
    (m4_id, 'Day 46: Virtual Envs', '# Objectives\n- venv\n- Poetry intro', 0, 45),
    (m4_id, 'Day 47: Advanced Tooling', '# Objectives\n- Ruff (Linter)\n- Black (Formatter)', 1, 45),
    (m4_id, 'Day 48: Regex', '# Objectives\n- re module\n- Pattern matching', 2, 60),
    (m4_id, 'Day 49: APIs', '# Objectives\n- requests library\n- HTTP methods', 3, 60),
    (m4_id, 'Day 50: Databases Intro', '# Objectives\n- SQLite\n- Basic CRUD', 4, 60),
    (m4_id, 'Day 51: ORMs', '# Objectives\n- SQLAlchemy basics', 5, 90),
    (m4_id, 'Day 52: Web Scraping', '# Objectives\n- BeautifulSoup\n- Selenium intro', 6, 60),
    (m4_id, 'Day 53: Data Basics', '# Objectives\n- NumPy Arrays\n- Pandas DataFrames', 7, 60),
    (m4_id, 'Day 54: Git', '# Objectives\n- Branching\n- Merging\n- Commits', 8, 45),
    (m4_id, 'Day 55: GitHub CI/CD', '# Objectives\n- Pull Requests\n- GitHub Actions', 9, 60),
    (m4_id, 'Day 56: Unit Testing', '# Objectives\n- pytest\n- Test cases', 10, 60),
    (m4_id, 'Day 57: Concurrency', '# Objectives\n- Threading vs Multiprocessing', 11, 60),
    (m4_id, 'Day 58: Capstone Plan', '# Objectives\n- Planning API Integration\n- Architecture', 12, 120),
    (m4_id, 'Day 59: Capstone Logic', '# Objectives\n- implementing core logic\n- Database storage', 13, 180),
    (m4_id, 'Day 60: Capstone Finish', '# Objectives\n- Testing\n- Final Polish\n- Portfolio', 14, 180);

END $$;
