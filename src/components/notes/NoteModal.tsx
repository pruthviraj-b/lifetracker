import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Pin, PinOff, Tag, Palette, Eye, Edit3, Sparkles, Wand2, Folder, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note, NoteCategory, CreateNoteInput, NoteFolder } from '../../types/note';
import { AIService } from '../../services/ai.service';
import { NoteService } from '../../services/note.service';
import { SyllabusRoadmap } from './SyllabusRoadmap';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (note: CreateNoteInput | Partial<Note>) => Promise<void>;
    initialNote?: Note | null;
}

const CATEGORIES: NoteCategory[] = ['general', 'work', 'personal', 'idea', 'list'];
const COLORS = [
    { name: 'Yellow', value: 'yellow' },
    { name: 'Blue', value: 'blue' },
    { name: 'Green', value: 'green' },
    { name: 'Purple', value: 'purple' },
    { name: 'Pink', value: 'pink' },
    { name: 'Gray', value: 'gray' }
];

const TEMPLATES = [
    { name: 'Empty', content: '' },
    { name: 'Meeting', content: '# Meeting: [Title]\n\n## Attendees\n- \n\n## Agenda\n- \n\n## Discussion\n- \n\n## Action Items\n- [ ] ' },
    { name: 'Project', content: '# Project: [Name]\n\n> Goal: \n\n## Timeline\n- [ ] Q1: \n- [ ] Q2: \n\n## Tech Stack\n- \n\n## Resources\n- ' },
    { name: 'Checklist', content: '# Tasks\n\n- [ ] item 1\n- [ ] item 2\n- [ ] item 3' },
    { name: 'Reflection', content: '# Daily Reflection\n\n- **Wins**: \n- **Challenges**: \n- **Focus for tomorrow**: ' }
];

export function NoteModal({ isOpen, onClose, onSave, initialNote }: NoteModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isAILoading, setIsAILoading] = useState(false);
    const [folders, setFolders] = useState<NoteFolder[]>([]);
    const [formData, setFormData] = useState<any>({
        title: '',
        content: '',
        category: 'general',
        color: 'yellow',
        isPinned: false,
        folderId: ''
    });
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    useEffect(() => {
        if (isOpen) {
            loadFolders();
        }
        if (initialNote) {
            setFormData({
                title: initialNote.title,
                content: initialNote.content,
                category: initialNote.category,
                color: initialNote.color,
                isPinned: initialNote.isPinned,
                folderId: initialNote.folderId || ''
            });
        } else {
            setFormData({
                title: '',
                content: '',
                category: 'general',
                color: 'yellow',
                isPinned: false,
                folderId: ''
            });
        }
        setActiveTab('edit');
    }, [initialNote, isOpen]);

    const loadFolders = async () => {
        try {
            const data = await NoteService.getFolders();
            setFolders(data);
        } catch (error) {
            console.error(error);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAIPolish = async () => {
        if (!formData.content.trim()) return;
        setIsAILoading(true);
        try {
            const polished = await AIService.polishNote(formData.content);
            setFormData({ ...formData, content: polished });
            showToast('AI Sidekick', 'Note polished and structured.', { type: 'success' });
        } catch (error) {
            showToast('AI Error', 'Failed to polish note.', { type: 'error' });
        } finally {
            setIsAILoading(false);
        }
    };

    const handleAISummarize = async () => {
        if (!formData.content.trim()) return;
        setIsAILoading(true);
        try {
            const summary = await AIService.summarizeNote(formData.content);
            setFormData({ ...formData, content: summary + '\n\n---\n\n' + formData.content });
            showToast('AI Sidekick', 'Summary generated and added.', { type: 'success' });
        } catch (error) {
            showToast('AI Error', 'Failed to summarize note.', { type: 'error' });
        } finally {
            setIsAILoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full ${formData.title.toLowerCase().includes('syllabus') ? 'max-w-6xl h-[90vh]' : 'max-w-lg'} bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col`}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b flex items-center justify-between shrink-0">
                        <h2 className="text-xl font-bold">{initialNote ? 'Edit Note' : 'Create New Note'}</h2>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
                                className={`p-2 rounded-lg transition-colors ${formData.isPinned ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                            >
                                {formData.isPinned ? <Pin className="w-5 h-5" /> : <PinOff className="w-5 h-5" />}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`p-6 space-y-6 overflow-y-auto ${formData.title.toLowerCase().includes('syllabus') ? 'flex-1' : 'max-h-[70vh]'}`}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                Title
                                {!initialNote && (
                                    <select
                                        onChange={(e) => {
                                            const template = TEMPLATES.find(t => t.name === e.target.value);
                                            if (template) setFormData({ ...formData, content: template.content });
                                        }}
                                        className="text-[10px] bg-muted border-none outline-none font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer"
                                    >
                                        <option value="">Choose Template</option>
                                        {TEMPLATES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                    </select>
                                )}
                            </label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Note title..."
                                required
                                className="text-lg font-bold"
                            />
                        </div>

                        <div className="flex bg-muted p-1 rounded-xl gap-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('edit')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'edit' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Edit3 className="w-4 h-4" />
                                Editor
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('preview')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'preview' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {formData.title.toLowerCase().includes('syllabus') ? <MapPin className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {formData.title.toLowerCase().includes('syllabus') ? 'Roadmap' : 'Preview'}
                            </button>
                        </div>

                        {activeTab === 'edit' ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                    Content
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAIPolish}
                                            disabled={isAILoading || !formData.content}
                                            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
                                            title="Polish note with AI"
                                        >
                                            <Wand2 className={`w-3 h-3 ${isAILoading ? 'animate-pulse' : ''}`} />
                                            Polish
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAISummarize}
                                            disabled={isAILoading || !formData.content}
                                            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                                            title="Summarize with AI"
                                        >
                                            <Sparkles className={`w-3 h-3 ${isAILoading ? 'animate-pulse' : ''}`} />
                                            Summarize
                                        </button>
                                        <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded">Markdown Supported</span>
                                    </div>
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Write something amazing using **markdown**..."
                                    className="w-full min-h-[250px] p-4 rounded-xl bg-background border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none font-mono text-sm leading-relaxed"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-sm font-medium text-muted-foreground">
                                    {formData.title.toLowerCase().includes('syllabus') ? 'Interactive Roadmap' : 'Preview'}
                                </label>
                                <div className={`w-full min-h-[250px] p-6 rounded-xl bg-muted/50 border border-transparent overflow-y-auto prose prose-sm dark:prose-invert max-w-none ${formData.title.toLowerCase().includes('syllabus') ? 'bg-background' : ''}`}>
                                    {formData.content ? (
                                        formData.title.toLowerCase().includes('syllabus') ? (
                                            <SyllabusRoadmap
                                                note={{ ...initialNote || {}, content: formData.content } as Note}
                                                onUpdateContent={async (newContent) => {
                                                    setFormData({ ...formData, content: newContent });
                                                }}
                                            />
                                        ) : (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {formData.content}
                                            </ReactMarkdown>
                                        )
                                    ) : (
                                        <p className="text-muted-foreground italic mt-4 text-center">Nothing to preview yet...</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Folder className="w-4 h-4" /> Folder
                                </label>
                                <select
                                    value={formData.folderId}
                                    onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                                    className="w-full p-2.5 rounded-lg bg-background border outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">No Folder</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Tag className="w-4 h-4" /> Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-2.5 rounded-lg bg-background border outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Palette className="w-4 h-4" /> Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: color.value })}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color.value === 'yellow' ? 'bg-yellow-500' :
                                            color.value === 'blue' ? 'bg-blue-500' :
                                                color.value === 'green' ? 'bg-green-500' :
                                                    color.value === 'purple' ? 'bg-purple-500' :
                                                        color.value === 'pink' ? 'bg-pink-500' :
                                                            'bg-gray-500'
                                            } ${formData.color === color.value ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent'}`}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-muted/30 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            isLoading={loading}
                        >
                            {initialNote ? 'Save Changes' : 'Create Note'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
