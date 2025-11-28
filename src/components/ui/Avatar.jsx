import React from 'react';

export default function Avatar({ src, alt, size = 'md', className = '' }) {
    const sizeClasses = {
        sm: 'size-8 text-xs',
        md: 'size-10 text-sm',
        lg: 'size-12 text-base',
        xl: 'size-16 text-lg',
    };

    return (
        <div
            className={`
                relative shrink-0 overflow-hidden rounded-full bg-surface-hover dark:bg-surface-hover-dark
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    {alt ? alt.charAt(0).toUpperCase() : '?'}
                </div>
            )}
        </div>
    );
}
