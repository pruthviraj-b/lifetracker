import { supabase } from '../lib/supabase';
import { Course, CourseModule, Lesson, Enrollment, LessonProgress } from '../types/course';
import { HabitService } from './habit.service';
import { NoteService } from './note.service';
import { YouTubeService } from './youtube.service';
import { LearningService } from './learning.service';

export const CourseService = {
    // --- Public Content ---

    async getPublishedCourses(): Promise<Course[]> {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        let query = supabase.from('courses').select('*').eq('published', true);

        if (user) {
            query = query.or(`user_id.eq.${user.id},user_id.is.null`);
        } else {
            query = query.is('user_id', null);
        }

        const { data, error } = await query.order('title'); // ADDED

        if (error) throw error;
        return data || [];
    },

    // Used by YouTube Tracker
    async getCourses(): Promise<any[]> {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        let query = supabase.from('courses').select('*');

        if (user) {
            query = query.or(`user_id.eq.${user.id},user_id.is.null`);
        } else {
            query = query.is('user_id', null);
        }

        const { data, error } = await query.order('title');

        if (error) throw error;
        return data || [];
    },

    async getCourseDetails(courseId: string): Promise<{ course: Course, modules: CourseModule[] }> {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        // 1. Get Course (Filtered or Public)
        let query = supabase.from('courses').select('*').eq('id', courseId);

        if (user) {
            query = query.or(`user_id.eq.${user.id},user_id.is.null`);
        } else {
            query = query.is('user_id', null);
        }

        const { data: course, error: courseError } = await query.single();

        if (courseError) throw courseError;

        // 2. Get Modules with Lessons
        const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('*, lessons(*)')
            .eq('course_id', courseId)
            .order('order', { ascending: true }); // Order modules

        if (modulesError) throw modulesError;

        // Sort lessons within modules
        const sortedModules = modules.map(m => ({
            ...m,
            lessons: m.lessons?.map((l: Lesson) => ({
                ...l,
                is_free: l.order <= 2 // First 3 lessons are free preview
            })).sort((a: Lesson, b: Lesson) => a.order - b.order) || []
        }));

        return { course, modules: sortedModules };
    },

    // --- User Progress ---

    async enrollInCourse(courseId: string, userId: string): Promise<Enrollment> {
        if (!userId) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('enrollments')
            .insert({
                user_id: userId,
                course_id: courseId,
                progress_percent: 0,
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getMyEnrollment(courseId: string): Promise<Enrollment | null> {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return null;

        const { data, error } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore no rows found
        return data || null;
    },

    async markLessonComplete(lessonId: string, courseId: string, userId: string): Promise<void> {
        if (!userId) throw new Error('Not authenticated');

        // 1. Upsert Lesson Progress
        const { error: progressError } = await supabase
            .from('lesson_progress')
            .upsert({
                user_id: userId,
                lesson_id: lessonId,
                status: 'completed',
                completed_at: new Date().toISOString()
            }, { onConflict: 'user_id, lesson_id' });

        if (progressError) throw progressError;

        // 2. Recalculate Course Progress
        await this.updateCourseProgress(userId, courseId);

        // --- 🔗 DEEP SYNC: HABITS ---
        // Attempt to find a habit that matches the course title and mark it done
        try {
            const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single();
            if (course) {
                const habits = await HabitService.getHabits(userId);
                // Fuzzy match: If habit title contains course keyword (e.g. "Python")
                const matchingHabit = habits.find(h =>
                    course.title.toLowerCase().includes(h.title.toLowerCase()) ||
                    h.title.toLowerCase().includes(course.title.toLowerCase()) ||
                    (course.title.includes('Python') && h.title.includes('Code')) // Custom mapping example
                );

                if (matchingHabit && !matchingHabit.completedToday) {
                    const today = new Date().toISOString().split('T')[0];
                    await HabitService.toggleHabitCompletion(matchingHabit.id, today, true, userId);
                    console.log(`🔗 Auto-completed habit: ${matchingHabit.title}`);
                }
            }
        } catch (e) {
            console.warn("Habit sync failed gracefully:", e);
        }
    },

    async updateCourseProgress(userId: string, courseId: string) {
        // ... (existing updateCourseProgress logic, unchanged) ...
        const { data: modules } = await supabase
            .from('modules')
            .select('id')
            .eq('course_id', courseId);

        if (!modules || modules.length === 0) return;
        const moduleIds = modules.map(m => m.id);

        const { count: totalLessons } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .in('module_id', moduleIds);

        const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .in('module_id', moduleIds);

        if (!lessons || totalLessons === 0 || totalLessons === null) return;
        const allLessonIds = lessons.map(l => l.id);

        const { count: completedCount } = await supabase
            .from('lesson_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')
            .in('lesson_id', allLessonIds);

        const safeCompleted = completedCount || 0;
        const progress = Math.round((safeCompleted / totalLessons) * 100);

        await supabase
            .from('enrollments')
            .update({
                progress_percent: progress,
                completed_at: progress === 100 ? new Date().toISOString() : null
            })
            .eq('user_id', userId)
            .eq('course_id', courseId);
    },

    // ... (getCompletedLessons, etc. unchanged) ...
    async getCompletedLessons(courseId: string): Promise<string[]> {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return [];
        const { data: modules } = await supabase.from('modules').select('id').eq('course_id', courseId);
        if (!modules?.length) return [];
        const moduleIds = modules.map(m => m.id);
        const { data: lessons } = await supabase.from('lessons').select('id').in('module_id', moduleIds);
        if (!lessons?.length) return [];
        const lessonIds = lessons.map(l => l.id);
        const { data } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .in('lesson_id', lessonIds);
        return data?.map(d => d.lesson_id) || [];
    },

    async getLessonProgressDetails(lessonId: string): Promise<any> {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return null;

        const { data, error } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .maybeSingle(); // Use maybeSingle to avoid 0-row error, but catching multiple-row error

        if (error) {
            console.error("❌ Error fetching lesson progress:", error);
        }

        console.log(`📖 Loaded Lesson Payload (${lessonId}):`, data);
        return data;
    },

    async updateLessonJournal(lessonId: string, notes: string, resources: any[], userId: string): Promise<void> {
        if (!userId) throw new Error("Unauthorized");

        // 1. Check if exists to preserve status
        const { data: existing } = await supabase
            .from('lesson_progress')
            .select('status')

        // A. Save to Database
        const payload = {
            user_id: userId,
            lesson_id: lessonId,
            status: 'in_progress', // Default status if just saving notes
            notes: notes,
            resources: resources,
            last_accessed: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('lesson_progress')
            .upsert(payload, { onConflict: 'user_id, lesson_id' });

        if (error) {
            console.error("❌ Database Save Failed:", error);
            throw error;
        } else {
            console.log("✅ Database Save Successful");
        }

        // --- 🔗 DEEP SYNC: NOTES & RESOURCES ---
        try {
            // A. NOTES SYNC
            if (notes && notes.trim().length > 0) {
                // Get Lesson Title for the note
                const { data: lesson } = await supabase.from('lessons').select('title').eq('id', lessonId).single();
                const noteTitle = `Journal: ${lesson?.title || 'Unknown Lesson'}`;

                // Check if note exists
                const userNotes = await NoteService.getNotes();
                const existingNote = userNotes.find(n => n.title === noteTitle);

                if (existingNote) {
                    await NoteService.updateNote(existingNote.id, { content: notes });
                } else {
                    await NoteService.createNote({
                        title: noteTitle,
                        content: notes,
                        category: 'learning',
                        color: 'blue',
                        isPinned: false
                    }, userId);
                }
            }

            // B. RESOURCE SYNC (Videos & Links)
            console.log("🔄 Syncing Resources...", resources);
            for (const res of resources) {
                if (!res.url) continue;

                // 1. Get Course/Folder Metadata
                let folderName = "Course Resources";
                let courseId = undefined;

                try {
                    const { data: lesson } = await supabase.from('lessons').select('module_id').eq('id', lessonId).single();
                    if (lesson?.module_id) {
                        const { data: module } = await supabase.from('modules').select('course_id').eq('id', lesson.module_id).single();
                        if (module?.course_id) {
                            const { data: courseMeta } = await supabase.from('courses').select('id, title').eq('id', module.course_id).single();
                            if (courseMeta?.title) {
                                folderName = courseMeta.title;
                                courseId = courseMeta.id;
                            }
                        }
                    }
                } catch (metaErr) { /* ignore */ }

                // 2. Find or Create Target Folder
                const folders = await YouTubeService.getFolders();
                let targetFolder = folders.find(f => f.name === folderName);
                if (!targetFolder) {
                    targetFolder = await YouTubeService.createFolder(folderName);
                }

                if (res.url.includes('youtube.com') || res.url.includes('youtu.be')) {
                    // --- 🎥 CASE: YOUTUBE VIDEO ---
                    try {
                        const existingVideos = await YouTubeService.getVideos();
                        const existingVideo = existingVideos.find(v => v.url === res.url);

                        if (!existingVideo) {
                            console.log("➕ Adding video to library...");
                            await YouTubeService.addVideo({
                                url: res.url,
                                difficulty: 'beginner',
                                folderId: targetFolder?.id,
                                courseId: courseId
                            });
                        } else if (courseId && !existingVideo.courseId) {
                            console.log("🩹 Healing: Link video to course...");
                            await supabase.from('youtube_videos').update({ course_id: courseId }).eq('id', existingVideo.id);
                        }
                    } catch (yErr) { console.error("❌ YouTube Sync failed:", yErr); }
                } else {
                    // --- 🔗 CASE: REGULAR LINK ---
                    try {
                        const { data: existingRes } = await supabase.from('learning_resources')
                            .select('id, course_id')
                            .eq('url', res.url)
                            .maybeSingle();

                        if (!existingRes) {
                            console.log("➕ Adding resource to library...");
                            await LearningService.createResource({
                                title: res.title || 'Linked Resource',
                                url: res.url,
                                type: 'link',
                                folderId: targetFolder?.id,
                                courseId: courseId
                            });
                        } else if (courseId && !existingRes.course_id) {
                            console.log("🩹 Healing: Link resource to course...");
                            await supabase.from('learning_resources').update({ course_id: courseId }).eq('id', existingRes.id);
                        }
                    } catch (rErr) { console.error("❌ Resource Sync failed:", rErr); }
                }
            }
        } catch (syncErr) {
            console.error("❌ Deep sync failed:", syncErr);
            // Don't block the main save flow
        }
    },

    // --- Admin / Seeding ---

    /*
     * Checks if a course exists by title. If not, it creates it using the provided data.
     * Use this when users "Install" a course to ensure the Academy DB is populated.
     */
    async ensureCourseExists(courseData: any, thumbnail: string, level: string, tags: string[], forceUpdate: boolean = false): Promise<string> {
        const { habit, note } = courseData;

        // 1. Check if exists
        const { data: existing } = await supabase
            .from('courses')
            .select('id')
            .eq('title', habit.title)
            .single();

        let courseId = existing?.id;

        if (existing) {
            console.log(`Course ${habit.title} exists. ID: ${existing.id}`);
            // Update metadata to ensure it's current
            await supabase.from('courses').update({
                description: note.title,
                thumbnail_url: thumbnail,
                difficulty_level: level,
                tags: tags,
                duration_weeks: Math.ceil(habit.goalDuration / 7),
                published: true
            }).eq('id', existing.id);
        } else {
            // 2. Insert if new
            console.log(`Creating new course: ${habit.title}`);
            const { data: course, error: courseError } = await supabase
                .from('courses')
                .insert({
                    title: habit.title,
                    description: note.title,
                    thumbnail_url: thumbnail,
                    difficulty_level: level,
                    tags: tags,
                    duration_weeks: Math.ceil(habit.goalDuration / 7),
                    published: true
                })
                .select()
                .single();

            if (courseError) throw courseError;
            courseId = course.id;
        }

        // 3. Check Content State
        const { count } = await supabase
            .from('modules')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', courseId);

        const hasContent = count !== null && count > 0;

        // 4. Seed Content if empty or forced
        if (!hasContent || forceUpdate) {
            console.log(`Seeding content for ${habit.title} (Force: ${forceUpdate})`);

            if (forceUpdate && hasContent) {
                // Dangerous: Wipe existing content to rebuild
                await supabase.from('modules').delete().eq('course_id', courseId);
            }

            const modules = this.parseMarkdownToStructure(habit.title, note.content);

            for (const mod of modules) {
                const { data: moduleData, error: moduleError } = await supabase
                    .from('modules')
                    .insert({
                        course_id: courseId,
                        title: mod.title,
                        order: mod.order
                    })
                    .select()
                    .single();

                if (moduleError) {
                    console.error("Error creating module:", moduleError);
                    continue;
                }

                if (mod.lessons.length > 0) {
                    const lessonsToInsert = mod.lessons.map((l: any) => ({
                        module_id: moduleData.id,
                        title: l.title,
                        content: l.content || '',
                        duration_minutes: 15, // Default
                        order: l.order
                        // removed is_free due to missing DB column
                    }));

                    const { error: lessonError } = await supabase
                        .from('lessons')
                        .insert(lessonsToInsert);

                    if (lessonError) console.error("Error creating lessons:", lessonError);
                }
            }
        }

        return courseId;
    },

    parseMarkdownToStructure(title: string, content: string) {
        const modules: any[] = [];
        const lines = content.split('\n');

        // State
        let currentModule: any = null;
        let currentLesson: any = null;
        let lessonOrder = 0;

        const saveCurrentLesson = () => {
            if (currentLesson && currentModule) {
                // Ensure content isn't empty
                if (!currentLesson.content.trim()) {
                    currentLesson.content = `# ${currentLesson.title}\n\nContent coming soon...`;
                }

                // Add default formatting if it's just raw text
                if (!currentLesson.content.includes('# ')) {
                    currentLesson.content = `# ${currentLesson.title}\n\n${currentLesson.content}`;
                }

                currentModule.lessons.push(currentLesson);
                currentLesson = null;
            }
        };

        lines.forEach((line) => {
            const trimmed = line.trim();

            if (line.startsWith('## ')) {
                saveCurrentLesson();
                if (currentModule) modules.push(currentModule);

                currentModule = {
                    title: line.replace('## ', '').trim(),
                    order: modules.length,
                    lessons: []
                };
                lessonOrder = 0;

            } else if (line.startsWith('### ')) {
                // NEW FORMAT: ### Day 1: Title
                saveCurrentLesson();
                const lessonTitle = line.replace('### ', '').trim();

                // Extract duration if present (15 min)
                let duration = 15;

                currentLesson = {
                    title: lessonTitle,
                    content: '', // Will append subsequent lines here
                    duration_minutes: duration,
                    order: lessonOrder++
                };

            } else if (trimmed.startsWith('* **Day') || trimmed.match(/^\d+\.\s+\*\*/)) {
                // LEGACY FORMAT: * **Day 1**: Title
                // OR Resource List: 1. **Resource**
                saveCurrentLesson();

                // Regex for Day format
                const dayMatch = line.match(/^\s*[\-\*]\s+\*\*(Day\s+\d+(?:-\d+)?)\*\*:(.*)/);
                // Regex for Resource format
                const resourceMatch = line.match(/^\s*\d+\.\s+\*\*\[?(.*?)\]?(\(.*?\))?\*\*\s*-?(.*)/);

                if (dayMatch && currentModule) {
                    const day = dayMatch[1].trim();
                    const topic = dayMatch[2].trim();

                    // Create immediately (no content accumulation for legacy)
                    currentModule.lessons.push({
                        title: `${day}: ${topic}`,
                        content: `# ${day}: ${topic}\n\n**${topic}**\n\nStart your learning journey for today!`,
                        duration_minutes: 60,
                        order: lessonOrder++
                    });
                } else if (resourceMatch && currentModule) {
                    const resourceTitle = resourceMatch[1].trim();
                    const description = resourceMatch[3]?.trim() || "";

                    currentModule.lessons.push({
                        title: resourceTitle,
                        content: `# ${resourceTitle}\n\n${description}\n\n[Open Resource](${resourceMatch[2] || '#'})`,
                        duration_minutes: 10,
                        order: lessonOrder++,
                        is_free: true
                    });
                }

            } else {
                // CONTENT LINE
                if (currentLesson) {
                    currentLesson.content += line + '\n';
                }
            }
        });

        // Cleanup
        saveCurrentLesson();
        if (currentModule) modules.push(currentModule);

        // Safety Fallback
        if (modules.length === 0) {
            modules.push({
                title: "Course Content",
                order: 0,
                lessons: [{
                    title: "Welcome to " + title,
                    content: "# Welcome\n\nCourse content is loading...",
                    duration_minutes: 5,
                    order: 0
                }]
            });
        }

        return modules;
    },
    // --- Reset ---

    async resetAllAcademyData(): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) throw new Error('Not authenticated');

        console.log("♻️ Factory Resetting Academy Data...");

        // 1. Delete User Progress
        await supabase.from('lesson_progress').delete().eq('user_id', user.id);
        await supabase.from('enrollments').delete().eq('user_id', user.id);

        // 2. Delete Content (Only if we want to wipe the global catalog too, which seems to be the user's request "all deleted")
        // Note: In a real multi-tenant app, we wouldn't delete courses. But for this "Personal Learning OS", we do.
        // We rely on Cascade Delete from 'courses' to wipe modules/lessons

        const { error } = await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) {
            console.error("Failed to delete courses:", error);
            // Fallback: Delete child tables manually if cascade fails
            await supabase.from('modules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }
    },
    async getCourseStats(courseId: string) {
        const { data: videos, error } = await supabase
            .from('youtube_videos')
            .select('status, duration_seconds')
            .eq('course_id', courseId)
            .eq('is_archived', false);

        if (error || !videos) {
            console.error("Error fetching course stats:", error);
            return {
                totalVideos: 0,
                completedVideos: 0,
                totalDurationSeconds: 0,
                remainingDurationSeconds: 0,
                completionPercentage: 0
            };
        }

        const totalVideos = videos.length;
        const completedVideos = videos.filter(v => v.status === 'watched').length;
        const totalDuration = videos.reduce((acc, v) => acc + (v.duration_seconds || 0), 0);
        const watchedDuration = videos
            .filter(v => v.status === 'watched')
            .reduce((acc, v) => acc + (v.duration_seconds || 0), 0);

        return {
            totalVideos,
            completedVideos,
            totalDurationSeconds: totalDuration,
            remainingDurationSeconds: Math.max(0, totalDuration - watchedDuration),
            completionPercentage: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0
        };
    },

    async addVideoToCourse(videoId: string, courseId: string, sortOrder: number = 0) {
        const { error } = await supabase
            .from('youtube_videos')
            .update({ course_id: courseId, sort_order: sortOrder })
            .eq('id', videoId);
        if (error) throw error;
    },

    async createCourse(input: { title: string, folderId?: string }) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('courses')
            .insert({
                user_id: user.id,
                title: input.title,
                folder_id: input.folderId,
                published: true,
                difficulty: 'beginner'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteCourse(id: string): Promise<void> {
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async checkPrerequisitesMet(videoId: string): Promise<boolean> {
        // Basic check: if video is part of a course, check if previous lessons exist and are done
        // For now, return true to avoid locking users out of legacy videos
        return true;
    }
};
