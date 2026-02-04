import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing env vars. Ensure .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const seedPythonCourse = async () => {
    console.log("Seeding Python Course...");

    // 1. Create Course
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
            title: "Python Programming Mastery",
            description: "From absolute beginner to advanced backend developer. Master the language of AI and Data Science.",
            thumbnail_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop",
            difficulty_level: "Beginner",
            duration_weeks: 4,
            tags: ["python", "coding", "backend"],
            published: true
        })
        .select()
        .single();

    if (courseError) {
        console.error("Course creation failed", courseError);
        return;
    }
    console.log("Course created:", course.id);

    // 2. Create Modules
    const modulesData = [
        { title: "Phase 1: The Core", description: "Master the syntax, variables, and loops that form the foundation.", order: 0 },
        { title: "Phase 2: Data Structures", description: "Lists, Dictionaries, Sets - organizing data like a pro.", order: 1 },
        { title: "Phase 3: Object Oriented", description: "Classes, Inheritance, and building real systems.", order: 2 },
        { title: "Phase 4: Final Project", description: "Build a real-world application.", order: 3 }
    ];

    for (const m of modulesData) {
        const { data: module, error: modError } = await supabase
            .from('modules')
            .insert({
                course_id: course.id,
                title: m.title,
                description: m.description,
                order: m.order
            })
            .select()
            .single();

        if (modError) {
            console.error("Module failed", modError);
            continue;
        }

        // 3. Create Lessons for this Module
        // Just adding sample lessons for now
        const lessonsData = [
            { title: "Installation & Setup", type: "text", duration: 10, order: 0 },
            { title: "Hello World & Variables", type: "video", duration: 15, order: 1 },
            { title: "Control Flow Logic", type: "quiz", duration: 20, order: 2 },
            { title: "Function Mastery", type: "project", duration: 45, order: 3 }
        ];

        for (const l of lessonsData) {
            await supabase.from('lessons').insert({
                module_id: module.id,
                title: `${m.title} - ${l.title}`,
                type: l.type,
                duration_minutes: l.duration,
                order: l.order,
                content: `
# ${l.title}

Welcome to this lesson on **${l.title}**.

### Key Concepts
- Concept A
- Concept B
- Concept C

\`\`\`python
def hello_world():
    print("Welcome to the Academy")
\`\`\`

Complete the challenge below to proceed.
                `
            });
        }
    }

    console.log("Seeding Complete!");
};

seedPythonCourse();
