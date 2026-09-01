import { json, type RequestHandler } from "@sveltejs/kit";
import { addData, fetchEventFromEventId } from "$lib/scripts/dynamo";
import jwt from 'jsonwebtoken';
import { JWT_SECRET, NODE_ENV, GOOGLE_CLIENT_ID } from '$env/static/private';
import type { GoogleUser } from "$lib/type/googleUser";

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