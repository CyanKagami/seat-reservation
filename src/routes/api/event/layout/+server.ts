import { json, type RequestHandler } from "@sveltejs/kit";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { verifyAccess } from "$lib/scripts/authorization";
import type { User } from "$lib/type/user";
import { addFile, readFileAsByteArray, readFileAsString } from "$lib/scripts/s3";
import { updateAllAttributes } from "$lib/scripts/dynamo";

interface UpdataLayoutFormData {
    layoutFile: File,
    eventId: string
}

export const GET: RequestHandler = async ({request, cookies, url}) => {
    const token = request.headers.get('Authorization')?.split(" ")[1] || cookies.get('user_session') || "";
    
    // Verify the token signature
    const decoded:User = jwt.verify(token, JWT_SECRET) as User;
    if (!(await verifyAccess(decoded, ['admin', 'organizer']))) {
        return json(
            {
                statusCode: 403,
                body: { error: "Access denied" }
            }
        );
    }
    let eventId = url.searchParams.get('eventId');
    try {
        const fileContent = await readFileAsByteArray('k-seat-event-layout', `${eventId}.msgpack`)
        return new Response(fileContent, {
			status: 200,
			headers: {
				'Content-Type': 'application/msgpack',
				'Content-Length': fileContent.byteLength.toString(),
				'Cache-Control': 'no-cache'
            }
        })
    }
    catch(err) {
        console.log(err);
        return json(
            {
                statusCode: 500,
                body: {
                    "message": "Internal Server Error"
                }
            }
        )
    }
    
}

export const PUT: RequestHandler = async ({request, cookies}) => {
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

    let data:UpdataLayoutFormData = Object.fromEntries(await request.formData()) as unknown as UpdataLayoutFormData
    let fileBuffer = Buffer.from(await data.layoutFile.arrayBuffer())
    try {
        let layoutURL = await addFile("k-seat-event-layout", `${data.eventId}.msgpack`, fileBuffer);
        await updateAllAttributes("events", {eventId:data.eventId}, {layoutURL: layoutURL});
    }
    catch(err) {
        console.log(err);
        return json(
            {
                statusCode: 500,
                body: {
                    "message": "Internal Server Error"
                }
            }
        )
    }
    return json(
        {
            statusCode: 200,
            body: {
                "message": "OK"
            }
        }
    )
}