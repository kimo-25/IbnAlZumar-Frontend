// File: src/components/ui/ReminderBanner.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Sparkles } from 'lucide-react';

const ReminderBanner = () => {
    const [reminder, setReminder] = useState(null);

    const fetchRandomReminder = async () => {
        try {
            const response = await axiosInstance.get('/Reminders/random');
            if (response.data) {
                setReminder(response.data);
            }
        } catch (error) {
            console.warn("Could not fetch reminder:", error.message);
        }
    };

    useEffect(() => {
        fetchRandomReminder();
        const interval = setInterval(fetchRandomReminder, 30000); // يتحدث كل 30 ثانية
        return () => clearInterval(interval);
    }, []);

    if (!reminder) return null;

    return (
        <div className="bg-graphite-900 text-amber py-2 px-4 text-center text-xs sm:text-sm font-medium shadow-inner flex items-center justify-center gap-2 border-b border-border/40 transition-all duration-500">
            <Sparkles size={16} className="shrink-0 animate-pulse text-amber" />
            <span className="truncate">{reminder.content || reminder.title || reminder.message}</span>
        </div>
    );
};

export default ReminderBanner;