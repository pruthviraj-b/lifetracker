import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
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
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    green: 'bg-green-500/10 border-green-500/20 text-green-500',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-500',
    gray: 'bg-gray-500/10 border-gray-500/20 text-gray-500',
};

export default function NotesPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
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
            // Don't alert on load, just console error to avoid spamming
            // But if it's a 404/403 it's useful to know
            if (error.message?.includes('relation "notes" does not exist')) {
                showToast('Database Error', "Table 'notes' is missing. Run the SQL schema to fix.", { type: 'error' });
            } else {
                showToast('Error', 'Failed to load notes', { type: 'error' });
            }
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
            showToast('Error', 'Failed to fetch folders', { type: 'error' });
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
            showToast('Success', 'Folder created', { type: 'success' });
        } catch (error) {
            showToast('Error', 'Failed to create folder', { type: 'error' });
        }
    };

    const handleDeleteFolder = async (id: string) => {
        if (!confirm('Are you sure? This will not delete the notes inside.')) return;
        try {
            await NoteService.deleteFolder(id);
            if (selectedFolderId === id) setSelectedFolderId(null);
            fetchFolders();
            showToast('Success', 'Folder deleted', { type: 'success' });
        } catch (error) {
            showToast('Error', 'Failed to delete folder', { type: 'error' });
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
            showToast('Success', editingNote ? 'Note updated successfully' : 'Note created successfully', { type: 'success' });
        } catch (error: any) {
            console.error(error);
            showToast('Error', error.message || 'Failed to save note', { type: 'error' });
        }
    };

    const handleDeleteNote = async (id: string) => { // Removed e: React.MouseEvent from signature
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            await NoteService.deleteNote(id);
            fetchNotes(); // Changed from setNotes(prev => prev.filter(n => n.id !== id));
            showToast('Success', 'Note deleted successfully', { type: 'success' });
        } catch (error) {
            console.error(error);
            showToast('Error', 'Failed to delete note', { type: 'error' });
        }
    };

    const togglePin = async (note: Note, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await NoteService.updateNote(note.id, { isPinned: !note.isPinned });
            await fetchNotes(); // Changed from loadNotes();
            showToast('Success', note.isPinned ? 'Note unpinned' : 'Note pinned', { type: 'success' });
        } catch (error) {
            console.error(error);
            showToast('Error', 'Failed to toggle pin', { type: 'error' });
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
        <div className={`min-h-screen bg-background relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : 'font-sans'}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Folders</h3>
                                <button
                                    onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                                    className="p-1 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <FolderPlus className="w-4 h-4" />
                                </button>
                            </div>

                            {isCreatingFolder && (
                                <form onSubmit={handleCreateFolder} className="animate-in slide-in-from-top-2 duration-200">
                                    <input
                                        autoFocus
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="Folder name..."
                                        className="w-full bg-muted border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    />
                                </form>
                            )}

                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedFolderId(null)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${!selectedFolderId ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                >
                                    <FolderIcon className="w-4 h-4" />
                                    All Notes
                                </button>
                                {folders.map(folder => (
                                    <div key={folder.id} className="group flex items-center">
                                        <button
                                            onClick={() => setSelectedFolderId(folder.id)}
                                            className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${selectedFolderId === folder.id ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                        >
                                            <FolderIcon className="w-4 h-4" />
                                            {folder.name}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteFolder(folder.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Categories</h3>
                            <div className="flex flex-wrap md:flex-col gap-2">
                                {['all', 'general', 'work', 'personal', 'idea', 'list', 'learning'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all text-left ${selectedCategory === cat
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                    >
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 space-y-8">
                        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isWild ? 'animate-reveal' : ''}`}>
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" className={`rounded-full w-10 h-10 p-0 ${isWild ? 'rounded-none border-2' : ''}`} onClick={() => navigate('/')}>
                                    <Home className="w-5 h-5" />
                                </Button>
                                <div>
                                    <h1 className={`text-4xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>Neural Notes</h1>
                                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest opacity-70">Cognitive Backup Sequence</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => {
                                    setEditingNote(null);
                                    setIsModalOpen(true);
                                }}
                                className={`h-12 px-8 shadow-xl shadow-primary/20 hover:scale-105 transition-transform ${isWild ? 'rounded-none border-2 animate-pulse' : 'rounded-2xl'}`}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Initialize Note
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setIsFlashcardModalOpen(true)}
                                className={`h-12 w-12 p-0 flex items-center justify-center ${isWild ? 'rounded-none border-2' : 'rounded-2xl'}`}
                                title="Create Flashcard"
                            >
                                <Zap className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Scan mind_logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-12 h-14 bg-card border-2 focus:border-primary/20 text-lg shadow-sm ${isWild ? 'rounded-none border-primary/20' : 'rounded-2xl border-transparent'}`}
                            />
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse border" />
                                ))}
                            </div>
                        ) : filteredNotes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredNotes.map(note => {
                                    // Calculate Progress
                                    const totalTasks = (note.content.match(/\[[ x]\]/g) || []).length;
                                    const completedTasks = (note.content.match(/\[x\]/g) || []).length;
                                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                                    const handleCheckboxClick = async (lineIndex: number, currentChecked: boolean) => {
                                        const lines = note.content.split('\n');
                                        // ReactMarkdown line numbers are 1-based, array is 0-based.
                                        // Often the position might be slightly off due to wrapping, but for simple lists it works.
                                        // We need to find the line. Use the index passed from the renderer?
                                        // Actually, let's toggle based on content match if line is tricky? 
                                        // No, node.position.start.line is best.

                                        const targetLine = lines[lineIndex - 1];
                                        if (!targetLine) return; // Error safety

                                        // Toggle [ ] <-> [x]
                                        const newContent = lines.map((line, idx) => {
                                            if (idx === lineIndex - 1) {
                                                return line.includes('[x]') ? line.replace('[x]', '[ ]') : line.replace('[ ]', '[x]');
                                            }
                                            return line;
                                        }).join('\n');

                                        // Optimistic Update (optional, but UI needs it)
                                        // For now, just save and let fetchNotes refresh. 
                                        // To make it instant, we might need local state update or fast re-fetch.
                                        // Let's do instant Fire-and-Forget update + Refresh

                                        try {
                                            await NoteService.updateNote(note.id, { content: newContent });
                                            fetchNotes(); // Refresh UI
                                        } catch (e) { console.error(e); }
                                    };

                                    return (
                                        <div
                                            key={note.id}
                                            onClick={() => {
                                                setEditingNote(note);
                                                setIsModalOpen(true);
                                            }}
                                            className={`group relative bg-card border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${isWild ? 'rounded-none border-primary/20 hover:border-primary hover:bg-primary/5' : 'hover:bg-muted/30 border-transparent hover:border-primary/10 rounded-[2rem] p-6'}`}
                                        >
                                            {note.isPinned && (
                                                <div className="absolute top-4 right-4 text-primary animate-in zoom-in duration-300">
                                                    <Pin className="w-5 h-5 fill-current" />
                                                </div>
                                            )}

                                            {/* Progress Bar */}
                                            {totalTasks > 0 && (
                                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted/50 overflow-hidden rounded-t-[2rem]">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-500 ease-out"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            )}

                                            <div className="mb-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${COLOR_CLASSES[note.color]}`}>
                                                        {note.category}
                                                    </div>
                                                    {totalTasks > 0 && (
                                                        <div className="text-[10px] font-bold text-muted-foreground">
                                                            {progress}% Done
                                                        </div>
                                                    )}
                                                    {note.type === 'youtube' && (
                                                        <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">
                                                            <Youtube className="w-3 h-3" />
                                                            Video Note
                                                        </div>
                                                    )}
                                                </div>

                                                <h3 className="text-xl font-bold mb-3 line-clamp-1">{note.title}</h3>
                                                <div className="text-muted-foreground text-sm line-clamp-4 leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none notes-markdown">
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
                                                                                e.stopPropagation(); // Prevent card click
                                                                                // node.position.start.line
                                                                                if (props.node && props.node.position) {
                                                                                    handleCheckboxClick(props.node.position.start.line, props.checked);
                                                                                }
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()} // Extra safety
                                                                            className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer align-middle mr-2 mt-0.5"
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

                                            <div className="mt-6 pt-4 border-t flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(note.updatedAt).toLocaleDateString()}
                                                    {note.timestamp_seconds !== undefined && (
                                                        <span className="ml-2 flex items-center gap-1 text-primary">
                                                            <Play className="w-3 h-3" />
                                                            {Math.floor(note.timestamp_seconds / 60)}:{(note.timestamp_seconds % 60).toString().padStart(2, '0')}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent opening note modal
                                                            togglePin(note, e);
                                                        }}
                                                        className="p-2 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors"
                                                    >
                                                        {note.isPinned ? <Pin className="w-4 h-4" /> : <Pin className="w-4 h-4 opacity-40" />}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent opening note modal
                                                            handleDeleteNote(note.id);
                                                        }}
                                                        className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"
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
                            <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed">
                                <div className="bg-background w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Search className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">No notes found</h3>
                                <p className="text-muted-foreground mb-8">Try adjusting your search or filters.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('all');
                                        setSelectedFolderId(null);
                                    }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
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
