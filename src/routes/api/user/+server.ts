import { json, type RequestHandler } from "@sveltejs/kit";
import { addFile, createBucket } from "$lib/scripts/s3";
import { addData, fetchEventFromHost, fetchUser, paginateReadData, updateAllAttributes } from "$lib/scripts/dynamo";
import type { Event } from "$lib/type/event";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import type { GoogleUser } from "$lib/type/googleUser";
import { verifyAccess } from "$lib/scripts/authorization";
import type { User } from "$lib/type/user";

export const GET: RequestHandler = async ({request, cookies, url}) => {
    const token = request.headers.get('Authorization')?.split(" ")[1] || cookies.get('user_session') || "";
    
    // Verify the token signature
    const decoded:User = jwt.verify(token, JWT_SECRET) as User;
    if (!(await verifyAccess(decoded, ['admin']))) {
        return json(
            {
                statusCode: 403,
                body: { error: "Access denied" }
            }
        );
    }
    let page = url.searchParams.get('nextToken') || undefined;
    try {
        let {items, nextToken} = (await paginateReadData("users", 25, page))
        for (let item of items) {
            delete item.googleId; // Remove googleId from the response
        }
        return json(
            {
                statusCode: 200,
                body: { items, nextToken }
            }
        )
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return json(
            {
                statusCode: 500,
                body: { error: "Internal server error" }
            }
        );
    }
}