// File: src/components/ui/ReminderBanner.jsx
import React, { useEffect, useState } from 'react';
import { getReminders } from '../../api/reminders';

const ReminderBanner = () => {
    const [reminders, setReminders] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const data = await getReminders();
                if (data && data.length > 0) {
                    setReminders(data);
                }
            } catch (error) {
                console.error("Error fetching reminders:", error);
            }
        };

        fetchReminders();
    }, []);

    useEffect(() => {
        if (reminders.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % reminders.length);
        }, 5000); // يقلب كل 5 ثواني

        return () => clearInterval(interval);
    }, [reminders.length]);

    if (reminders.length === 0) return null;

    return (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-inner transition-all duration-500">
            <div className="max-w-7xl mx-auto flex justify-center items-center">
                <span>{reminders[currentIndex]?.title || reminders[currentIndex]?.message}</span>
            </div>
        </div>
    );
};

export default ReminderBanner;