import React from 'react';

export default function Card({ children, className = '', ...props }) {
    return (
        <div
            className={`
                rounded-xl border border-border-light dark:border-border-dark
                bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-sm
                shadow-soft dark:shadow-none
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}
