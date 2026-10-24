import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import FreelancerLayout from './freelancer_side/Layouts/FreelancerLayout';

const pages = import.meta.glob([
    './Pages/**/*.jsx',
    './company_side/**/*.jsx',
    './freelancer_side/Pages/**/*.jsx',
]);

// Stable layout reference defined outside the resolve callback to prevent remounting persistent layout
const defaultFreelancerLayout = page => <FreelancerLayout>{page}</FreelancerLayout>;

// Safe route helper fallback to prevent crashes if route() is called in Inertia components
if (typeof window !== 'undefined' && !window.route) {
    window.route = (name, params) => {
        const routes = {
            'freelancer.dashboard': () => '/freelancer',
            'freelancer.proposals': () => '/freelancer/proposals',
            'freelancer.projects': () => '/freelancer/projects',
            'freelancer.services': () => '/freelancer/services',
            'freelancer.earnings': () => '/freelancer/earnings',
            'freelancer.chat': () => '/freelancer/chat',
            'freelancer.profile': () => '/freelancer/profile',
            'freelancer.settings': () => '/freelancer/settings',
            'freelancer.orders.accept': (id) => `/freelancer/orders/${id}/accept`,
            'freelancer.orders.reject': (id) => `/freelancer/orders/${id}/reject`,
            'freelancer.portfolio.store': () => '/freelancer/services/portfolio',
            'freelancer.portfolio.update': (id) => `/freelancer/services/portfolio/${id}`,
            'freelancer.specialties.update': () => '/freelancer/services/specialties',
            'freelancer.earnings.withdraw': () => '/freelancer/earnings/withdraw',
        };
        if (routes[name]) {
            return routes[name](params);
        }
        return typeof params === 'string' || typeof params === 'number' ? `/${name}/${params}` : `/${name}`;
    };
}

createInertiaApp({
    resolve: async name => {
        const pagePaths = [
            `./Pages/${name}.jsx`,
            `./freelancer_side/Pages/${name.replace('freelancer/', '')}.jsx`,
            `./company_side/${name.replace('company_side/', '')}.jsx`,
        ];

        for (const pagePath of pagePaths) {
            if (pages[pagePath]) {
                const page = await pages[pagePath]();

                if (name.startsWith('freelancer/') && page.default.layout === undefined) {
                    page.default.layout = defaultFreelancerLayout;
                }

                return page;
            }
        }

        throw new Error(`Page not found: ${name}`);
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});