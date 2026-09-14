import { json, type RequestHandler } from "@sveltejs/kit";
import { updateAllAttributes } from "$lib/scripts/dynamo";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { verifyAccess } from "$lib/scripts/authorization";
import type { User } from "$lib/type/user";

export const POST: RequestHandler = async ({request, cookies, url}) => {
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
    let googleId = url.searchParams.get('googleId') || undefined;
    let role = url.searchParams.get('role') || undefined;
    if (!googleId || !role) {
        return json(
            {
                statusCode: 400,
                body: { error: "Missing required parameters" }
            }
        );
    }
    try {
        
        let newAttributes = await updateAllAttributes("users", { googleId }, {googleId, role})
        console.log(newAttributes);
        return json(
            {
                statusCode: 200,
                body: { message: "User role updated successfully", newAttributes }
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