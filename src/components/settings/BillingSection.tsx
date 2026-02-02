import React from 'react';
import { CreditCard, Star, Download } from 'lucide-react';
import { Button } from '../ui/Button';

export function BillingSection() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-semibold mb-1">Subscription & Billing</h2>
                <p className="text-sm text-muted-foreground">Manage your plan and payment methods.</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Star className="w-5 h-5 fill-primary" />
                            <span className="font-bold uppercase tracking-wider text-xs">Current Plan</span>
                        </div>
                        <h3 className="text-2xl font-bold">Pro Monthly</h3>
                        <p className="text-sm text-muted-foreground mt-1">Renews on Mar 12, 2026</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold">$9.99</span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                    </div>
                </div>
                <div className="mt-6 flex gap-3">
                    <Button>Manage Subscription</Button>
                    <Button variant="outline">View Invoices</Button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Payment Methods</h3>
                <div className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-neutral-800 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                        <div>
                            <p className="font-medium">Visa ending in 4242</p>
                            <p className="text-xs text-muted-foreground">Expires 12/28</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                </div>
                <Button variant="outline" className="w-full">+ Add Payment Method</Button>
            </div>
        </div>
    );
}
