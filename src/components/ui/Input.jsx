import React, { forwardRef, useId } from 'react';

const Input = forwardRef(({
    label,
    error,
    icon,
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const inputId = useId();

    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={props.id || inputId}
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark text-xl">
                            {icon}
                        </span>
                    </div>
                )}
                <input
                    ref={ref}
                    id={props.id || inputId}
                    className={`
                        w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-text-primary-light dark:text-text-primary-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark
                        focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:ring-primary/30 focus-visible:border-primary
                        disabled:cursor-not-allowed disabled:opacity-50
                        transition-all duration-200
                        ${icon ? 'pl-10' : ''}
                        ${error
                            ? 'border-danger focus:border-danger focus:ring-danger/20'
                            : 'border-border-light dark:border-border-dark'
                        }
                        ${className}
                    `}
                    aria-invalid={Boolean(error)}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-danger animate-fade-in">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
