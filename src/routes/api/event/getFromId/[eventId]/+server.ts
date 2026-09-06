import { json, type RequestHandler } from "@sveltejs/kit";
import { fetchEventFromEventId } from "$lib/scripts/dynamo";

export const GET: RequestHandler = async ({request, cookies, params}) => {
    const token = request.headers.get('Authorization')?.split(" ")[1] || cookies.get('user_session') || "";

    let data = await fetchEventFromEventId(params.eventId as string)
    return json(
        {
            statusCode: 200,
            body: data
        }
    )
}