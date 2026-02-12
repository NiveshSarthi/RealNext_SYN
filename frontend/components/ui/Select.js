import React from "react";
import { cn } from "../../utils/cn";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

// Simplified Select for immediate use. In production, Radix UI or Headless UI is better.
export function Select({ value, onValueChange, children }) {
    // This is a mock context/wrapper. The children (SelectTrigger, SelectContent) won't truly interact in this lightweight version without Context or state lifting.
    // For migration speed, I will rewrite this to use the native <select> style or a simplified custom one if needed.
    // However, the source uses composable Select components. I'll allow simple children mapping or Context.

    // To make it work 'nicely' with the ported code which uses SelectTrigger, Content etc., I'll create a Context.
    const [open, setOpen] = React.useState(false);

    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    )
}

const SelectContext = React.createContext({});

export function SelectTrigger({ className, children }) {
    const { open, setOpen, value } = React.useContext(SelectContext);
    return (
        <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                "bg-[#0E1117] border-[#1F2937] text-white",
                className
            )}
        >
            {children}
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </button>
    )
}

export function SelectValue({ placeholder }) {
    const { value } = React.useContext(SelectContext);
    return <span>{value || placeholder}</span>;
}

export function SelectContent({ className, children }) {
    const { open, setOpen, onValueChange } = React.useContext(SelectContext);
    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
                "bg-[#161B22] border-[#1F2937] text-white top-full mt-2 w-full",
                className
            )}>
                <div className="p-1">
                    {children && React.Children.map(children, child => {
                        if (!React.isValidElement(child)) return child;
                        return React.cloneElement(child, {
                            onSelect: (val) => {
                                onValueChange(val);
                                setOpen(false);
                            }
                        });
                    })}
                </div>
            </div>
        </>
    );
}

export function SelectItem({ value, children, onSelect }) {
    return (
        <div
            onClick={() => onSelect && onSelect(value)}
            className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-white/10 cursor-pointer"
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {/* Check icon if selected could go here */}
            </span>
            <span className="truncate">{children}</span>
        </div>
    )
}
