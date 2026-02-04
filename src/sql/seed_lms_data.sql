-- Seed Data for Python Mastery Course

-- 1. Insert Course and capture ID
do $$
declare
    course_id uuid;
    module_core_id uuid;
    module_data_id uuid;
    module_oop_id uuid;
    module_final_id uuid;
    my_user_id uuid := auth.uid(); -- If running in dashboard, might be null, so we set author_id nullable or use valid ID if known.
begin
    -- Create Course
    insert into courses (title, description, thumbnail_url, difficulty_level, duration_weeks, tags, published)
    values (
        'Python Programming Mastery',
        'From absolute beginner to advanced backend developer. Master the language of AI and Data Science.',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop',
        'Beginner',
        4,
        ARRAY['python', 'coding', 'backend'],
        true
    ) returning id into course_id;

    -- Create Modules
    insert into modules (course_id, title, description, "order")
    values (course_id, 'Phase 1: The Core', 'Master the syntax, variables, and loops that form the foundation.', 0)
    returning id into module_core_id;

    insert into modules (course_id, title, description, "order")
    values (course_id, 'Phase 2: Data Structures', 'Lists, Dictionaries, Sets - organizing data like a pro.', 1)
    returning id into module_data_id;

    insert into modules (course_id, title, description, "order")
    values (course_id, 'Phase 3: Object Oriented', 'Classes, Inheritance, and building real systems.', 2)
    returning id into module_oop_id;

    insert into modules (course_id, title, description, "order")
    values (course_id, 'Phase 4: Final Project', 'Build a real-world application.', 4)
    returning id into module_final_id;

    -- Create Lessons for Core Module
    insert into lessons (module_id, title, content, type, duration_minutes, "order")
    values 
    (module_core_id, 'Installation & Setup', '# Installation\n\n- Download Python\n- Install VS Code\n- Print "Hello World"', 'text', 10, 0),
    (module_core_id, 'Variables & Types', '# Variables\n\n`x = 10`\n`y = "Hello"`', 'video', 15, 1),
    (module_core_id, 'Control Flow', '# Logic\n\nIf/Else statements...', 'quiz', 20, 2);

    -- Create Lessons for Data Module
    insert into lessons (module_id, title, content, type, duration_minutes, "order")
    values 
    (module_data_id, 'Lists & Tuples', '# Lists\n\nOrdered collections...', 'text', 15, 0),
    (module_data_id, 'Dictionaries', '# Dicts\n\nKey-value pairs...', 'video', 20, 1);

end $$;
