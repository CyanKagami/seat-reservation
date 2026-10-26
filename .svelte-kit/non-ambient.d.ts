
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/(client)/(student)" | "/(client)/(staff)" | "/(client)" | "/" | "/admin" | "/admin/places" | "/admin/places/[placeId]" | "/admin/places/[placeId]/seatmap" | "/admin/users" | "/api" | "/api/auth" | "/api/auth/google" | "/api/auth/google/callback" | "/api/event" | "/api/event/getFromHost" | "/api/event/getFromId" | "/api/event/getFromId/[eventId]" | "/api/event/layout" | "/api/location" | "/api/place" | "/api/place/layout" | "/api/place/[placeId]" | "/api/user" | "/api/user/editRole" | "/(client)/(student)/event-info" | "/(client)/(student)/event-info/[eventId]" | "/login" | "/(client)/(staff)/my-event" | "/(client)/(staff)/my-event/create-event" | "/(client)/(staff)/my-event/update-event" | "/(client)/(staff)/my-event/update-event/[eventId]" | "/(client)/(staff)/my-event/update-event/[eventId]/seatmap" | "/(client)/(student)/reservation" | "/(client)/(student)/reservation/[eventId]";
		RouteParams(): {
			"/admin/places/[placeId]": { placeId: string };
			"/admin/places/[placeId]/seatmap": { placeId: string };
			"/api/event/getFromId/[eventId]": { eventId: string };
			"/api/place/[placeId]": { placeId: string };
			"/(client)/(student)/event-info/[eventId]": { eventId: string };
			"/(client)/(staff)/my-event/update-event/[eventId]": { eventId: string };
			"/(client)/(staff)/my-event/update-event/[eventId]/seatmap": { eventId: string };
			"/(client)/(student)/reservation/[eventId]": { eventId: string }
		};
		LayoutParams(): {
			"/(client)/(student)": { eventId?: string | undefined };
			"/(client)/(staff)": { eventId?: string | undefined };
			"/(client)": { eventId?: string | undefined };
			"/": { placeId?: string | undefined; eventId?: string | undefined };
			"/admin": { placeId?: string | undefined };
			"/admin/places": { placeId?: string | undefined };
			"/admin/places/[placeId]": { placeId: string };
			"/admin/places/[placeId]/seatmap": { placeId: string };
			"/admin/users": Record<string, never>;
			"/api": { eventId?: string | undefined; placeId?: string | undefined };
			"/api/auth": Record<string, never>;
			"/api/auth/google": Record<string, never>;
			"/api/auth/google/callback": Record<string, never>;
			"/api/event": { eventId?: string | undefined };
			"/api/event/getFromHost": Record<string, never>;
			"/api/event/getFromId": { eventId?: string | undefined };
			"/api/event/getFromId/[eventId]": { eventId: string };
			"/api/event/layout": Record<string, never>;
			"/api/location": Record<string, never>;
			"/api/place": { placeId?: string | undefined };
			"/api/place/layout": Record<string, never>;
			"/api/place/[placeId]": { placeId: string };
			"/api/user": Record<string, never>;
			"/api/user/editRole": Record<string, never>;
			"/(client)/(student)/event-info": { eventId?: string | undefined };
			"/(client)/(student)/event-info/[eventId]": { eventId: string };
			"/login": Record<string, never>;
			"/(client)/(staff)/my-event": { eventId?: string | undefined };
			"/(client)/(staff)/my-event/create-event": Record<string, never>;
			"/(client)/(staff)/my-event/update-event": { eventId?: string | undefined };
			"/(client)/(staff)/my-event/update-event/[eventId]": { eventId: string };
			"/(client)/(staff)/my-event/update-event/[eventId]/seatmap": { eventId: string };
			"/(client)/(student)/reservation": { eventId?: string | undefined };
			"/(client)/(student)/reservation/[eventId]": { eventId: string }
		};
		Pathname(): "/" | "/admin/places" | `/admin/places/${string}` & {} | `/admin/places/${string}/seatmap` & {} | "/admin/users" | "/api/auth/google" | "/api/auth/google/callback" | "/api/event" | "/api/event/getFromHost" | `/api/event/getFromId/${string}` & {} | "/api/event/layout" | "/api/location" | "/api/place" | "/api/place/layout" | `/api/place/${string}` & {} | "/api/user" | "/api/user/editRole" | `/event-info/${string}` & {} | "/login" | "/my-event" | "/my-event/create-event" | `/my-event/update-event/${string}` & {} | `/my-event/update-event/${string}/seatmap` & {} | `/reservation/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/image/itbuilding.jpeg" | "/image/kmitlbuilding.webp" | "/image/name.jpeg" | "/image/placeholder.png" | "/robots.txt" | string & {};
	}
}