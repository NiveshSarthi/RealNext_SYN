import React from 'react';

export const Switch = React.forwardRef(({ className = '', checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange?.(!checked)}
            className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors focus-visible:outline-none focus-visible:ring-2 
                focus-visible:ring-offset-2 focus-visible:ring-offset-white
                disabled:cursor-not-allowed disabled:opacity-50
                ${checked ? 'bg-indigo-600' : 'bg-gray-700'}
                ${className}
            `}
            ref={ref}
            {...props}
        >
            <span
                className={`
                    inline-block h-4 w-4 transform rounded-full bg-white shadow-lg
                    transition-transform
                    ${checked ? 'translate-x-6' : 'translate-x-1'}
                `}
            />
        </button>
    );
});

Switch.displayName = 'Switch';

export default Switch;
