import { CourseService } from '../services/course.service';
import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import {
    DIVIDER,
    EMOJI,
    FlowField,
    extractName,
    formatDetailsBlock,
    formatHeader,
    loadLocalData,
    addLocalItem,
    updateLocalData,
    findLocalItemByName
} from './chatUtils';

const parseInput = (text: string) => {
    const title = extractName(text, ['course', 'academy', 'lesson']);
    return { title: title || undefined };
};

const getCreateFields = (): FlowField[] => [
    {
        key: 'title',
        question: 'Course name?',
        parser: (input: string) => ({ title: input.trim() })
    },
    {
        key: 'description',
        question: 'Short description?',
        optional: true,
        parser: (input: string) => ({ description: input.trim() })
    },
    {
        key: 'lessons',
        question: 'How many lessons?',
        parser: (input: string) => ({ lessons: Number(input.match(/\d+/)?.[0] || 0) })
    },
    {
        key: 'lessonDuration',
        question: 'How long per lesson (minutes)?',
        parser: (input: string) => ({ lessonDuration: Number(input.match(/\d+/)?.[0] || 0) })
    },
    {
        key: 'frequency',
        question: 'How often will lessons happen? (e.g., weekly)',
        optional: true,
        parser: (input: string) => ({ frequency: input.trim() })
    }
];

const buildSummary = (action: string, data: Record<string, any>, target?: TargetMatch) => {
    const title = (data.title || target?.name || 'Course').toString().toUpperCase();
    const details = [
        { label: 'Title', value: data.title || target?.name || 'Untitled' },
        { label: 'Lessons', value: data.lessons ? `${data.lessons}` : 'Not set' },
        { label: 'Duration', value: data.lessonDuration ? `${data.lessonDuration} min` : 'Not set' },
        { label: 'Frequency', value: data.frequency || 'Weekly' }
    ];
    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock(`${title} COURSE`, details)}\n\nConfirm this course?`;
};

const findTarget = async (name: string, _ctx: AssistantContext) => {
    const courses = await CourseService.getCourses();
    const match = courses.find(course => course.title.toLowerCase().includes(name.toLowerCase()));
    if (!match) return null;
    return { id: match.id, name: match.title, item: match };
};

const createCourse = async (data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to create courses.` };
    const course = await CourseService.createCourse({ title: data.title });

    addLocalItem(ctx.userId, 'academyDrafts', {
        courseId: course.id,
        title: course.title,
        description: data.description,
        lessons: data.lessons,
        lessonDuration: data.lessonDuration,
        frequency: data.frequency
    });

    const details = [
        { label: 'Lessons', value: data.lessons ? `${data.lessons}` : 'Not set' },
        { label: 'Duration', value: data.lessonDuration ? `${data.lessonDuration} min` : 'Not set' },
        { label: 'Status', value: 'Ready to start' }
    ];

    return {
        message: `${EMOJI.success} CREATED!\n${DIVIDER}\n\n${formatDetailsBlock(course.title.toUpperCase(), details)}`,
        actions: [
            { id: 'academy-start', label: 'Start course', value: `start ${course.title} course`, kind: 'reply', variant: 'primary' },
            { id: 'academy-view', label: 'View courses', value: 'show courses', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'academy', id: course.id, name: course.title, data: course }
    };
};

const viewCourses = async (_target: TargetMatch | null, ctx: AssistantContext): Promise<ActionResult> => {
    const courses = await CourseService.getCourses();
    if (!courses.length) {
        return { message: `${EMOJI.info} No courses found.` };
    }
    const list = courses.slice(0, 6).map(course => `- ${course.title}`).join('\n');
    return {
        message: `\uD83C\uDF93 COURSES\n${DIVIDER}\n\n${list}`,
        actions: [
            { id: 'academy-create', label: 'Create course', value: 'create course', kind: 'reply', variant: 'primary' }
        ]
    };
};

const enrollCourse = async (target: TargetMatch, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId || !target.id) return { message: `${EMOJI.warning} Please sign in to enroll.` };
    await CourseService.enrollInCourse(target.id, ctx.userId);
    return {
        message: `${EMOJI.success} ENROLLED!\n${DIVIDER}\n\nYou are enrolled in ${target.name}.`,
        actions: [
            { id: 'academy-progress', label: 'View progress', value: 'my course progress', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'academy', id: target.id, name: target.name }
    };
};

const restoreCourse = async (data: any, ctx: AssistantContext): Promise<ActionResult> => {
    const restored = addLocalItem(ctx.userId, 'academyDrafts', data);
    return {
        message: `${EMOJI.success} RESTORED\n${DIVIDER}\n\n${restored.title} restored.`,
        entity: { type: 'academy', id: restored.courseId, name: restored.title }
    };
};

export const Academy: ChatHandler = {
    entity: 'academy',
    label: 'Academy',
    parseInput,
    getCreateFields,
    buildSummary,
    findTarget,
    create: createCourse,
    view: viewCourses,
    complete: enrollCourse,
    restore: restoreCourse
};
