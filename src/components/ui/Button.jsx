import React from 'react';

const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-soft hover:shadow-soft-lg focus-visible:outline-primary/70',
    secondary: 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark focus-visible:outline-border-light dark:focus-visible:outline-border-dark',
    ghost: 'bg-transparent hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark focus-visible:outline-border-light/80 dark:focus-visible:outline-border-dark/70',
    danger: 'bg-danger text-white hover:bg-red-600 focus-visible:outline-danger/80',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs h-9',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    icon: 'p-2 h-10 w-10 rounded-full',
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
                inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            type={props.type || 'button'}
            aria-busy={isLoading}
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
