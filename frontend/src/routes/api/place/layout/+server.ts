// /api/place/layout/+server.ts
import { json, type RequestHandler } from "@sveltejs/kit";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { verifyAccess } from "$lib/scripts/authorization";
import type { User } from "$lib/type/user";
import { addFile, readFileAsByteArray, readFileAsString } from "$lib/scripts/s3";
import { updateAllAttributes } from "$lib/scripts/dynamo";
import { guard } from "$lib/scripts/guard";

interface UpdataLayoutFormData {
    layoutFile: File,
    placeId: string
}

export const GET: RequestHandler = async (event) => {
    const user = await guard(event, ['admin', 'organizer']);
  if (user instanceof Response) return user;
 
  const placeId = event.url.searchParams.get('placeId');
  if (!placeId) return new Response(null, { status: 400 });
    try {
        const fileContent = await readFileAsByteArray('layouts/place', `${placeId}.msgpack`)
        return new Response(fileContent as any as BodyInit, {
			status: 200,
			headers: {
				'Content-Type': 'application/msgpack',
				'Content-Length': fileContent.byteLength.toString(),
				'Cache-Control': 'no-cache'
            }
        })
    }
    catch (err) {
        console.error(err);
        return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
    }
    
}

export const PUT: RequestHandler = async (event) => {
    const user = await guard(event, ['admin']);
    if (user instanceof Response) return user;

    const form = await event.request.formData();
    const placeId = form.get('placeId') as string | null;
    const layoutFile = form.get('layoutFile') as File | null;
    if (!placeId || !layoutFile) {
        return json({ error: 'Missing placeId or layoutFile' }, { status: 400 });
    }


    try {
        const fileBuffer = Buffer.from(await layoutFile.arrayBuffer());
        let layoutURL = await addFile("layouts/place", `${placeId}.msgpack`, fileBuffer);

        await updateAllAttributes("places", {placeId}, {layoutURL});
        return json({ body: { message: 'OK' } });
    }
    catch (err) {
        console.error(err);
        return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
    }
}