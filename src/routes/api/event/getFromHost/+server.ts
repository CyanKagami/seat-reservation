import { json, type RequestHandler } from "@sveltejs/kit";
import { addData, fetchEventFromHost } from "$lib/scripts/dynamo";
import jwt from 'jsonwebtoken';
import { JWT_SECRET, NODE_ENV, GOOGLE_CLIENT_ID } from '$env/static/private';
import type { GoogleUser } from "$lib/type/googleUser";


export const GET: RequestHandler = async ({request, cookies}) => {
    const token = request.headers.get('Authorization')?.split(" ")[1] || cookies.get('user_session') || "";

    // Verify the token signature
    const decoded:GoogleUser = jwt.verify(token, JWT_SECRET) as GoogleUser;
    let data = await fetchEventFromHost(decoded.email)
    return json(
        {
            statusCode: 200,
            body: data
        }
    )
}