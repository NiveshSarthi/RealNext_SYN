import React from "react";
import { cn } from "../../utils/cn";
import { XMarkIcon } from "@heroicons/react/24/outline";

const DialogContext = React.createContext({});

export function Dialog({ open, onOpenChange, children }) {
    if (!open) return null;
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {children}
            </div>
        </DialogContext.Provider>
    );
}

export function DialogContent({ className, children, ...props }) {
    const { onOpenChange } = React.useContext(DialogContext);
    return (
        <div
            className={cn(
                "relative grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
                "bg-[#161B22] border-[#1F2937] text-white", // Dark mode defaults
                className
            )}
            {...props}
        >
            <button
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
                <XMarkIcon className="h-4 w-4 text-gray-400" />
                <span className="sr-only">Close</span>
            </button>
            {children}
        </div>
    );
}

export function DialogHeader({ className, ...props }) {
    return (
        <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
    );
}

export function DialogFooter({ className, ...props }) {
    return (
        <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
    );
}

export function DialogTitle({ className, ...props }) {
    return (
        <h3
            className={cn(
                "text-lg font-semibold leading-none tracking-tight",
                className
            )}
            {...props}
        />
    );
}
