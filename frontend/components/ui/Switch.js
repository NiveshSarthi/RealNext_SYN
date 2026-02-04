import { Switch } from '@headlessui/react';

export default function Toggle({ enabled, onChange, srTitle }) {
    return (
        <Switch
            checked={enabled}
            onChange={onChange}
            className={`${enabled ? 'bg-primary shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-muted'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ring-offset-background`}
        >
            <span className="sr-only">{srTitle || 'Enable setting'}</span>
            <span
                className={`${enabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
        </Switch>
    );
}
