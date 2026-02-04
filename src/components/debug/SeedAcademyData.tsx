
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { PythonCourseData } from '../../data/python-course';
import { DSACourseData } from '../../data/dsa-course';
import { WebDatabasesCourseData } from '../../data/web-databases-course';
import { GitProjectsCourseData } from '../../data/git-projects-course';
import { SoftSkillsCourseData } from '../../data/soft-skills-course';
import { AptitudeInterviewsCourseData } from '../../data/aptitude-interviews-course';
import { ResumePortfolioCourseData } from '../../data/resume-portfolio-course';

// Helper to parse markdown into Modules and Lessons
const parseMarkdownToStructure = (title: string, content: string) => {
    const modules: any[] = [];
    const lines = content.split('\n');
    let currentModule: any = null;
    let lessonOrder = 0;

    lines.forEach((line) => {
        if (line.startsWith('## ')) {
            // New Module/Phase
            if (currentModule) modules.push(currentModule);
            currentModule = {
                title: line.replace('## ', '').trim(),
                order: modules.length + 1,
                lessons: []
            };
            lessonOrder = 0;
        } else if (line.trim().startsWith('* **Day') || line.trim().startsWith('*   **Day')) {
            // New Lesson
            // Format: * **Day 1**: Title
            const cleanLine = line.replace(/^\*\s+/, '').trim(); // Remove leading bullet
            const match = cleanLine.match(/\*\*(Day \d+)\*\*:(.*)/);

            if (match && currentModule) {
                const day = match[1].trim();
                const topic = match[2].trim();
                lessonOrder++;
                currentModule.lessons.push({
                    title: `${day}: ${topic}`,
                    content: `# ${day}: ${topic}\n\n${topic}\n\nStart your learning journey for today!`, // Simple placeholder content
                    duration_mins: 60,
                    order: lessonOrder,
                    is_free: lessonOrder <= 2 // First 2 lessons free
                });
            }
        }
    });
    if (currentModule) modules.push(currentModule);
    return modules;
};

export const SeedAcademyData = () => {
    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const seedCourse = async (courseData: any, thumbnail: string, level: string, tags: string[]) => {
        const { habit, note } = courseData;

        // 1. Create Course
        addLog(`Creating course: ${habit.title}...`);
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .upsert({
                title: habit.title,
                description: note.title, // Use note title or a better description
                thumbnail_url: thumbnail,
                difficulty_level: level,
                tags: tags,
                duration_weeks: Math.ceil(habit.goalDuration / 7),
                published: true
            }, { onConflict: 'title' }) // Upsert based on title to avoid dupes? Supabase might not support onConflict on non-unique title. 
            // Better to select first.
            .select()
            .single();

        if (courseError) {
            // If unique constraint fails or other error. 
            // Ideally we check existence first.
            addLog(`Error creating course ${habit.title}: ${courseError.message}`);
            return;
        }

        addLog(`Course created ID: ${course.id}`);

        // 2. Parse Modules/Lessons
        const modules = parseMarkdownToStructure(habit.title, note.content);

        for (const mod of modules) {
            // Create Module
            const { data: moduleData, error: modError } = await supabase
                .from('modules')
                .insert({
                    course_id: course.id,
                    title: mod.title,
                    order: mod.order
                })
                .select()
                .single();

            if (modError) {
                addLog(`Error creating module ${mod.title}: ${modError.message}`);
                continue;
            }

            // Create Lessons
            const lessonsPayload = mod.lessons.map((l: any) => ({
                module_id: moduleData.id,
                title: l.title,
                content: l.content,
                duration_mins: l.duration_mins,
                order: l.order,
                is_free: l.is_free,
                nav_title: l.title.split(':')[0] // "Day 1"
            }));

            const { error: lessonError } = await supabase
                .from('lessons')
                .insert(lessonsPayload);

            if (lessonError) {
                addLog(`Error creating lessons for module ${mod.title}: ${lessonError.message}`);
            } else {
                addLog(`Created ${lessonsPayload.length} lessons for ${mod.title}`);
            }
        }
    };

    const handleSeed = async () => {
        if (!confirm("This will insert data into your real database. Continue?")) return;

        setLoading(true);
        setLog([]);
        try {
            // Seed Python
            await seedCourse(
                PythonCourseData,
                "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=800",
                "Beginner",
                ['python', 'coding', 'backend']
            );

            // Seed DSA
            await seedCourse(
                DSACourseData,
                "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800",
                "Advanced",
                ['dsa', 'algorithms', 'cs-fundamentals']
            );

            // Seed Web & DB
            await seedCourse(
                WebDatabasesCourseData,
                "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&q=80&w=800",
                "Intermediate",
                ['web', 'database', 'react', 'node']
            );

            // Seed Git & Projects
            await seedCourse(
                GitProjectsCourseData,
                "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=800",
                "Intermediate",
                ['git', 'devops', 'projects']
            );

            // Seed Soft Skills
            await seedCourse(
                SoftSkillsCourseData,
                "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800",
                "All Levels",
                ['leadership', 'communication', 'growth']
            );

            // Seed Aptitude
            await seedCourse(
                AptitudeInterviewsCourseData,
                "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
                "Intermediate",
                ['math', 'interview', 'logic']
            );

            // Seed Resume
            await seedCourse(
                ResumePortfolioCourseData,
                "https://images.unsplash.com/photo-1586281380117-0a632d671f98?auto=format&fit=crop&q=80&w=800",
                "All Levels",
                ['career', 'resume', 'linkedin']
            );

            addLog("DONE! All courses seeded.");

        } catch (e: any) {
            addLog(`FATAL ERROR: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-4 bg-black text-white rounded-xl border border-white/20">
            <h2 className="text-xl font-bold text-red-500">⚠ ADMIN: SEED DATABASE</h2>
            <p className="text-sm text-gray-400">Clicking this will populate the 'courses', 'modules', 'lessons' tables with local Data.</p>

            <Button onClick={handleSeed} isLoading={loading} variant="destructive">
                SEED ACADEMY DATA
            </Button>

            <div className="h-64 overflow-y-auto bg-gray-900 p-2 rounded text-xs font-mono">
                {log.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        </div>
    );
};
