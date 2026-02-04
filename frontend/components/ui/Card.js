import React from 'react';

export const Card = ({ children, className = '', hover = true, ...props }) => {
    return (
        <div
            className={`
        bg-card text-card-foreground rounded-xl border border-border/50
        ${hover ? 'hover:border-primary/50 transition-colors duration-300' : ''} 
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '', ...props }) => (
    <div className={`p-6 pb-2 ${className}`} {...props}>
        {children}
    </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
        {children}
    </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
    <p className={`text-sm text-muted-foreground mt-1.5 ${className}`} {...props}>
        {children}
    </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
    <div className={`p-6 pt-2 ${className}`} {...props}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
    <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>
        {children}
    </div>
);
