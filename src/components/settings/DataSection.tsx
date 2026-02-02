import React, { useState, useEffect } from 'react';
import { Database, Download, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { DataService } from '../../services/data.service';
import { useToast } from '../../context/ToastContext';

export function DataSection() {
    const { showToast } = useToast();
    const [stats, setStats] = useState<{ habits: number; logs: number; estimatedSize: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const s = await DataService.getStorageUsage();
        setStats(s);
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            await DataService.downloadExport();
            showToast("Data exported successfully", "success");
        } catch (error) {
            showToast("Failed to export data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setImporting(true);
            const text = await file.text();
            await DataService.importData(text);
            showToast("Data imported successfully! Reloading...", "success");
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error(error);
            showToast("Failed to import data. Invalid file.", "error");
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-semibold mb-1">Data Management</h2>
                <p className="text-sm text-muted-foreground">Control your data, export backups, or import from other devices.</p>
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-6">
                {/* Usage Stats */}
                <div className="grid grid-cols-3 gap-4 text-center pb-6 border-b">
                    <div>
                        <div className="text-2xl font-bold">{stats?.habits || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Habits</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats?.logs || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">History Logs</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats?.estimatedSize || '0 KB'}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Est. Size</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="outline" onClick={handleExport} disabled={loading} className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Export JSON
                    </Button>
                    <div className="relative flex-1">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            disabled={importing}
                        />
                        <Button variant="outline" className="w-full" disabled={importing}>
                            <Upload className="w-4 h-4 mr-2" />
                            {importing ? 'Importing...' : 'Import JSON'}
                        </Button>
                    </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                    Importing data will merge new entries with your existing data. Duplicate IDs will be updated.
                </p>
            </div>
        </div>
    );
}
