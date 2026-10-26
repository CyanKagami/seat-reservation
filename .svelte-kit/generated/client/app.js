// in dev, this makes Vite inject its client as this module's first dependency,
// so that global constant replacements are installed before any other module
// (including user hooks) evaluates. In build it's inert.
import.meta.hot;




export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15')
];

export const server_loads = [];

export const dictionary = {
		"/(client)": [4,[2]],
		"/admin/places": [11,[3]],
		"/admin/places/[placeId]": [12,[3]],
		"/admin/places/[placeId]/seatmap": [13,[3]],
		"/admin/users": [14,[3]],
		"/(client)/(student)/event-info/[eventId]": [9,[2]],
		"/login": [15],
		"/(client)/(staff)/my-event": [5,[2]],
		"/(client)/(staff)/my-event/create-event": [6,[2]],
		"/(client)/(staff)/my-event/update-event/[eventId]": [7,[2]],
		"/(client)/(staff)/my-event/update-event/[eventId]/seatmap": [8,[2]],
		"/(client)/(student)/reservation/[eventId]": [10,[2]]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';

export const get_error_template = () => import('../shared/error-template.js').then(m => m.default);