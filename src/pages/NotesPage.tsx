import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    StickyNote,
    Plus,
    Search,
    Pin,
    Trash2,
    Clock,
    Youtube,
    Play,
    FolderPlus,
    Folder as FolderIcon,
    Home,
    Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { NoteService } from '../services/note.service';
import { Note, CreateNoteInput, NoteFolder } from '../types/note';
import { NoteModal } from '../components/notes/NoteModal';
import { AddFlashcardModal } from '../components/flashcards/AddFlashcardModal';
import { SyllabusRoadmap } from '../components/notes/SyllabusRoadmap';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const COLOR_CLASSES: Record<string, string> = {
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    pink: 'bg-pink-50 text-pink-700 border-pink-100',
    gray: 'bg-stone-50 text-stone-700 border-stone-100',
};

export default function NotesPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [notes, setNotes] = useState<Note[]>([]);
    const [folders, setFolders] = useState<NoteFolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);

    useEffect(() => {
        fetchNotes();
        fetchFolders();
    }, []);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const data = await NoteService.getNotes();
            setNotes(data);
        } catch (error: any) {
            console.error(error);
            showToast('Error', 'Failed to load notes', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchFolders = async () => {
        try {
            const data = await NoteService.getFolders();
            setFolders(data);
        } catch (error) {
            console.error(error);
            showToast('Error', 'Failed to fetch collections', { type: 'error' });
        }
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        try {
            await NoteService.createFolder(newFolderName);
            setNewFolderName('');
            setIsCreatingFolder(false);
            fetchFolders();
            showToast('Success', 'Collection created', { type: 'success' });
        } catch (error) {
            showToast('Error', 'Failed to create collection', { type: 'error' });
        }
    };

    const handleDeleteFolder = async (id: string) => {
        if (!confirm('Are you sure? This will not delete the notes inside.')) return;
        try {
            await NoteService.deleteFolder(id);
            if (selectedFolderId === id) setSelectedFolderId(null);
            fetchFolders();
            showToast('Success', 'Collection deleted', { type: 'success' });
        } catch (error) {
            showToast('Error', 'Failed to delete collection', { type: 'error' });
        }
    };

    const handleSaveNote = async (noteData: CreateNoteInput | Partial<Note>) => {
        try {
            if (editingNote) {
                await NoteService.updateNote(editingNote.id, noteData);
            } else {
                await NoteService.createNote(noteData as CreateNoteInput);
            }
            await fetchNotes();
            showToast('Success', editingNote ? 'Note updated' : 'Note added', { type: 'success' });
        } catch (error: any) {
            console.error(error);
            showToast('Error', error.message || 'Failed to save note', { type: 'error' });
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            await NoteService.deleteNote(id);
            fetchNotes();
            showToast('Success', 'Note deleted', { type: 'success' });
        } catch (error) {
            console.error(error);
            showToast('Error', 'Failed to delete note', { type: 'error' });
        }
    };

    const togglePin = async (note: Note, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await NoteService.updateNote(note.id, { isPinned: !note.isPinned });
            await fetchNotes();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
        const matchesFolder = !selectedFolderId || note.folderId === selectedFolderId;
        return matchesSearch && matchesCategory && matchesFolder;
    });

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12 animate-claude-in">
            <div className="flex flex-col md:flex-row gap-12">
                {/* Sidebar */}
                <div className="w-full md:w-64 space-y-10 shrink-0">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Collections</h3>
                            <button
                                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                                className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <FolderPlus className="w-4 h-4 text-primary" />
                            </button>
                        </div>

                        {isCreatingFolder && (
                            <form onSubmit={handleCreateFolder} className="px-2">
                                <input
                                    autoFocus
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="New collection..."
                                    className="claude-input w-full text-sm"
                                />
                            </form>
                        )}

                        <div className="space-y-1">
                            <button
                                onClick={() => setSelectedFolderId(null)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all ${!selectedFolderId ? 'bg-primary/10 text-primary rounded-2xl' : 'text-muted-foreground hover:bg-secondary rounded-2xl'}`}
                            >
                                <FolderIcon className="w-4 h-4" />
                                All Notes
                            </button>
                            {folders.map(folder => (
                                <div key={folder.id} className="group flex items-center">
                                    <button
                                        onClick={() => setSelectedFolderId(folder.id)}
                                        className={`flex-1 flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all ${selectedFolderId === folder.id ? 'bg-primary/10 text-primary rounded-2xl' : 'text-muted-foreground hover:bg-secondary rounded-2xl'}`}
                                    >
                                        <FolderIcon className="w-4 h-4" />
                                        {folder.name}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteFolder(folder.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 px-2">Categories</h3>
                        <div className="flex flex-wrap md:flex-col gap-2 px-2">
                            {['all', 'general', 'work', 'personal', 'idea', 'list', 'learning'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all text-left rounded-xl ${selectedCategory === cat
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <StickyNote className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-foreground">Knowledge Base</h1>
                                <p className="text-muted-foreground text-sm">Organize your thoughts and resources.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => {
                                    setEditingNote(null);
                                    setIsModalOpen(true);
                                }}
                                className="claude-button px-8 h-12 bg-primary text-white shadow-lg shadow-primary/20"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Note
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setIsFlashcardModalOpen(true)}
                                className="w-12 h-12 p-0 flex items-center justify-center rounded-2xl border-border"
                                title="Create Flashcard"
                            >
                                <Zap className="w-5 h-5 text-primary" />
                            </Button>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search your knowledge base..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-16 h-16 bg-card border border-border rounded-3xl text-lg focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
                        />
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-64 animate-pulse bg-secondary rounded-[2rem]" />
                            ))}
                        </div>
                    ) : filteredNotes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredNotes.map(note => {
                                const totalTasks = (note.content.match(/\[[ x]\]/g) || []).length;
                                const completedTasks = (note.content.match(/\[x\]/g) || []).length;
                                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                                const handleCheckboxClick = async (lineIndex: number) => {
                                    const lines = note.content.split('\n');
                                    const targetLine = lines[lineIndex - 1];
                                    if (!targetLine) return;

                                    const newContent = lines.map((line, idx) => {
                                        if (idx === lineIndex - 1) {
                                            return line.includes('[x]') ? line.replace('[x]', '[ ]') : line.replace('[ ]', '[x]');
                                        }
                                        return line;
                                    }).join('\n');

                                    try {
                                        await NoteService.updateNote(note.id, { content: newContent });
                                        fetchNotes();
                                    } catch (e) {
                                        console.error(e);
                                    }
                                };

                                return (
                                    <div
                                        key={note.id}
                                        onClick={() => {
                                            setEditingNote(note);
                                            setIsModalOpen(true);
                                        }}
                                        className="claude-card group p-8 flex flex-col h-full cursor-pointer"
                                    >
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${COLOR_CLASSES[note.color] || COLOR_CLASSES.gray}`}>
                                                    {note.category}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {note.isPinned && (
                                                        <Pin className="w-4 h-4 text-primary fill-current" />
                                                    )}
                                                    {note.type === 'youtube' && (
                                                        <Youtube className="w-4 h-4 text-red-500" />
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-foreground leading-tight line-clamp-2">
                                                {note.title}
                                            </h3>

                                            <div className="text-muted-foreground text-sm line-clamp-4 leading-relaxed prose prose-stone prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        input: (props: any) => {
                                                            if (props.type === 'checkbox') {
                                                                return (
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={props.checked}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            if (props.node && props.node.position) {
                                                                                handleCheckboxClick(props.node.position.start.line);
                                                                            }
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer align-middle mr-2"
                                                                    />
                                                                );
                                                            }
                                                            return <input {...props} />;
                                                        }
                                                    }}
                                                >
                                                    {note.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                                                {progress > 0 && <span className="text-primary ml-2">{progress}% Done</span>}
                                            </div>

                                            <div className="flex items-center gap-2 lg:opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        togglePin(note, e);
                                                    }}
                                                    className="p-2 hover:bg-secondary rounded-xl transition-all"
                                                >
                                                    <Pin className={`w-4 h-4 ${note.isPinned ? 'text-primary fill-current' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteNote(note.id);
                                                    }}
                                                    className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-secondary/30 border-2 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center gap-6">
                            <div className="bg-primary/10 p-6 rounded-3xl">
                                <StickyNote className="w-12 h-12 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-foreground">No notes discovered yet</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">Build your personal workspace by adding your first note or connecting a resource.</p>
                            </div>
                            <Button
                                variant="outline"
                                className="claude-button px-10 h-14 bg-background border-border"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                    setSelectedFolderId(null);
                                }}
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <NoteModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingNote(null);
                }}
                onSave={handleSaveNote}
                initialNote={editingNote}
            />

            <AddFlashcardModal
                isOpen={isFlashcardModalOpen}
                onClose={() => setIsFlashcardModalOpen(false)}
            />
        </div>
    );
}
