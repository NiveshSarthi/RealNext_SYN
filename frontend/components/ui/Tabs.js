import React from "react";
import { cn } from "../../utils/cn";

const TabsContext = React.createContext({});

export function Tabs({ value, onValueChange, children }) {
    return (
        <TabsContext.Provider value={{ value, onValueChange }}>
            <div className="w-full">{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ className, children }) {
    return (
        <div className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
            "bg-slate-800/50",
            className
        )}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, className, children }) {
    const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
    const isSelected = selectedValue === value;

    return (
        <button
            onClick={() => onValueChange(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isSelected ? "bg-background text-foreground shadow-sm bg-indigo-600 text-white" : "hover:bg-white/5 text-gray-400",
                className
            )}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, className, children }) {
    const { value: selectedValue } = React.useContext(TabsContext);
    if (selectedValue !== value) return null;
    return (
        <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
            {children}
        </div>
    );
}
