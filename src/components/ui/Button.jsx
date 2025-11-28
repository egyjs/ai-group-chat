import React from 'react';

const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-soft hover:shadow-soft-lg',
    secondary: 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark',
    ghost: 'bg-transparent hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark',
    danger: 'bg-danger text-white hover:bg-red-600',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    icon,
    disabled,
    ...props
}) {
    return (
        <button
            className={`
                inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            ) : icon ? (
                <span className="material-symbols-outlined text-lg">{icon}</span>
            ) : null}
            {children}
        </button>
    );
}
