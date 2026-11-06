// Main menu, shared by the top bar (desktop) and the drop-down menu (phone).
import {
    BookOpen,
    ChartColumn,
    Eye,
    Gamepad2,
    House,
} from '@lucide/vue';
import type { Component } from 'vue';
import { markRaw } from 'vue';

export type NavItem = {
    label: string;
    href: string;
    icon: Component;
    /** URL path that marks the item as active. */
    match: string;
    exact?: boolean;
};

export function navigationItems(): NavItem[] {
    return [
        { label: 'Acasă', href: '/', icon: markRaw(House), match: '/', exact: true },
        { label: 'Exerciții', href: '/exercitii', icon: markRaw(Gamepad2), match: '/exercitii' },
        { label: 'Test de vedere', href: '/test-vedere', icon: markRaw(Eye), match: '/test-vedere' },
        { label: 'Rapoarte', href: '/rapoarte', icon: markRaw(ChartColumn), match: '/rapoarte' },
        { label: 'Ghid', href: '/ghid', icon: markRaw(BookOpen), match: '/ghid' },
    ];
}

export function isActive(item: NavItem, url: string): boolean {
    const path = url.split('?')[0];

    return item.exact
        ? path === item.match
        : path === item.match || path.startsWith(`${item.match}/`);
}
