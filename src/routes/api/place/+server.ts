import { json, type RequestHandler } from "@sveltejs/kit";
import { addFile, createBucket } from "$lib/scripts/s3";
import { addData, fetchAllData, fetchEventFromHost, fetchUser, paginateReadData, updateAllAttributes } from "$lib/scripts/dynamo";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { verifyAccess } from "$lib/scripts/authorization";
import type { User } from "$lib/type/user";

export const GET: RequestHandler = async ({request, cookies}) => {
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

    try {
        let data = await fetchAllData("places");
        console.log("Fetched data from 'places' table:", data);
        return json(
            {
                statusCode: 200,
                body: { data }
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