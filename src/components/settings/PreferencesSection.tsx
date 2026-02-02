import { Moon, Sun, Globe, Layout, Check, Type, Eye, Contrast, Clock, Sliders, Pipette, Flame } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function PreferencesSection() {
    const { preferences: prefs, updatePreferences } = useTheme();

    const updatePref = async (key: string, value: any) => {
        await updatePreferences({ [key]: value });
    };

    const accentColors = [
        { name: 'Emerald', hsl: '142 71% 45%' },
        { name: 'Sapphire', hsl: '217 91% 60%' },
        { name: 'Ruby', hsl: '0 84% 60%' },
        { name: 'Amethyst', hsl: '262 83% 58%' },
        { name: 'Amber', hsl: '38 92% 50%' },
        { name: 'Rose', hsl: '330 81% 60%' },
        { name: 'Slate', hsl: '215 25% 27%' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h2 className="text-xl font-semibold mb-1">Preferences & Customization</h2>
                <p className="text-sm text-muted-foreground">Personalize your app experience.</p>
            </div>

            {/* Theme */}
            <section className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Sun className="w-4 h-4 text-primary" />
                    App Theme
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { id: 'light', label: 'Light', icon: <Sun className="w-6 h-6 text-orange-500" />, bg: 'bg-white' },
                        { id: 'dark', label: 'Dark', icon: <Moon className="w-6 h-6 text-white" />, bg: 'bg-neutral-900' },
                        { id: 'auto', label: 'Auto (System)', icon: <Layout className="w-4 h-4" />, bg: 'bg-gradient-to-br from-neutral-100 to-neutral-800' }
                    ].map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => updatePref('theme', theme.id)}
                            className={`
                                relative flex flex-col items-center gap-2 p-4 border rounded-2xl transition-all
                                ${prefs.theme === theme.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-muted/50 border-border'}
                            `}
                        >
                            {prefs.theme === theme.id && (
                                <div className="absolute top-3 right-3 text-primary">
                                    <Check className="w-4 h-4" />
                                </div>
                            )}
                            <div className={`w-full aspect-video border rounded-xl shadow-inner flex items-center justify-center ${theme.bg}`}>
                                {theme.icon}
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider">{theme.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Accent Color */}
            <section className="space-y-4 p-6 bg-card border rounded-3xl">
                <h3 className="font-semibold flex items-center gap-2">
                    <Pipette className="w-4 h-4 text-primary" />
                    Accent Color
                </h3>
                <div className="flex flex-wrap gap-3">
                    {accentColors.map((color) => (
                        <button
                            key={color.hsl}
                            onClick={() => updatePref('accent_color', color.hsl)}
                            title={color.name}
                            className={`
                                w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center
                                ${prefs.accent_color === color.hsl ? 'scale-110 border-primary shadow-lg ring-4 ring-primary/20' : 'border-transparent hover:scale-105'}
                            `}
                            style={{ backgroundColor: `hsl(${color.hsl})` }}
                        >
                            {prefs.accent_color === color.hsl && <Check className="w-5 h-5 text-white mix-blend-difference" />}
                        </button>
                    ))}
                </div>
            </section>

            {/* Accessibility & Polish */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="space-y-4 p-6 bg-card border rounded-3xl">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Contrast className="w-4 h-4 text-primary" />
                        Accessibility & Experimental
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Contrast className="w-4 h-4" />
                                <span className="text-sm font-medium">High Contrast</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={prefs.high_contrast}
                                onChange={(e) => updatePref('high_contrast', e.target.checked)}
                                className="w-5 h-5 accent-primary cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm font-medium">Eye Strain Reduction</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={prefs.eye_strain_mode}
                                onChange={(e) => updatePref('eye_strain_mode', e.target.checked)}
                                className="w-5 h-5 accent-primary cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-all group overflow-hidden relative">
                            <div className="flex items-center gap-3 relative z-10">
                                <Flame className={`w-4 h-4 ${prefs.wild_mode ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                                <div>
                                    <span className="text-sm font-bold block">Wild Experience</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Immersive Noir Overhaul</span>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={prefs.wild_mode}
                                onChange={(e) => updatePref('wild_mode', e.target.checked)}
                                className="w-5 h-5 accent-primary cursor-pointer relative z-10"
                            />
                            {prefs.wild_mode && <div className="absolute inset-0 bg-primary/5 animate-pulse" />}
                        </div>
                    </div>
                </section>

                <section className="space-y-4 p-6 bg-card border rounded-3xl">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Type className="w-4 h-4 text-primary" />
                        Typography
                    </h3>
                    <div className="flex items-center gap-2">
                        {['sm', 'md', 'lg', 'xl'].map((size) => (
                            <button
                                key={size}
                                onClick={() => updatePref('font_size', size)}
                                className={`
                                    flex-1 py-3 rounded-xl border font-bold uppercase tracking-widest transition-all
                                    ${prefs.font_size === size ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border hover:bg-muted/50'}
                                `}
                                style={{ fontSize: size === 'sm' ? '12px' : size === 'md' ? '14px' : size === 'lg' ? '16px' : '18px' }}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            {/* Schedule & Brightness */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="space-y-4 p-6 bg-card border rounded-3xl">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Dark Mode Schedule
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-sm text-muted-foreground">Automatically enable Dark Mode at specific times.</span>
                            <input
                                type="checkbox"
                                checked={prefs.theme_schedule_enabled}
                                onChange={(e) => updatePref('theme_schedule_enabled', e.target.checked)}
                                className="w-5 h-5 accent-primary cursor-pointer"
                            />
                        </div>
                        {prefs.theme_schedule_enabled && (
                            <div className="flex gap-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Start Time</label>
                                    <input
                                        type="time"
                                        value={prefs.theme_schedule_start}
                                        onChange={(e) => updatePref('theme_schedule_start', e.target.value)}
                                        className="w-full bg-muted/30 border rounded-xl p-3 focus:ring-2 ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">End Time</label>
                                    <input
                                        type="time"
                                        value={prefs.theme_schedule_end}
                                        onChange={(e) => updatePref('theme_schedule_end', e.target.value)}
                                        className="w-full bg-muted/30 border rounded-xl p-3 focus:ring-2 ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="space-y-4 p-6 bg-card border rounded-3xl">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-primary" />
                        Brightness Control
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-muted-foreground italic">DIM</span>
                            <span className="text-primary font-bold">{prefs.brightness}%</span>
                            <span className="text-muted-foreground italic">VIBRANT</span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="100"
                            step="5"
                            value={prefs.brightness}
                            onChange={(e) => updatePref('brightness', parseInt(e.target.value))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                </section>
            </div>

            {/* Localization (Collapsed/Minimized) */}
            <section className="p-6 bg-muted/30 border border-dashed rounded-3xl space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    Localization & Regional
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Language</label>
                        <select
                            value={prefs.language}
                            onChange={(e) => updatePref('language', e.target.value)}
                            className="w-full p-2 border rounded-lg bg-card text-sm"
                        >
                            <option value="en-US">English (US)</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Date Format</label>
                        <select
                            value={prefs.date_format}
                            onChange={(e) => updatePref('date_format', e.target.value)}
                            className="w-full p-2 border rounded-lg bg-card text-sm"
                        >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        </select>
                    </div>
                </div>
            </section>
        </div>
    );
}
