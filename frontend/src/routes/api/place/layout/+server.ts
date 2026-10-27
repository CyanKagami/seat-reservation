// /api/place/layout/+server.ts
import { json, type RequestHandler } from "@sveltejs/kit";
import { addFile, deleteObjectsWithPrefix, readFileAsByteArray } from "$lib/scripts/server/s3";
import { updateAllAttributes } from "$lib/scripts/server/dynamo";
import { guard } from "$lib/scripts/server/guard";
import { decode, encode } from "@msgpack/msgpack";
import { convertToWebp, isValidDataUrl, parseDataUrl } from "$lib/scripts/server/utils";

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
        const fileContent = await readFileAsByteArray(`layouts/place/${placeId}`, `layout.msgpack`)
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
        const seatmap = decode(fileBuffer);
        let seatTypes: {name:string,color:string, description:string,picture:string}[]
        = Object.values(seatmap.seatTypes);
        let keepKeys = new Set(seatTypes.filter((v) => !isValidDataUrl(v.picture || '')).map((v) => `layouts/place/${placeId}/${v.name}.webp`));
        deleteObjectsWithPrefix(`layouts/place/${placeId}`, keepKeys);
        for (const value of seatTypes){
            if (!value.picture) continue;
            let buffer: Buffer;
            try{
                buffer = parseDataUrl(value.picture).buffer;
                let convertedImg = await convertToWebp(buffer, 80);
                let imgURL = await addFile(`layouts/place/${placeId}`, `${value.name}.webp`, convertedImg);
                seatmap.seatTypes[value.name].picture = imgURL;
            }
            catch (err){
                if ((err as Error).message !== 'Invalid Data URL format'){
                    throw err;
                }
            }

            
        }
        let binaryData = encode(seatmap)
        const blob = new Blob([binaryData as any], { type: 'application/msgpack' });
		const file = new File([blob], `placeholder.msgpack`, {
			type: blob.type,
			lastModified: Date.now()
		});
        let layoutURL = await addFile(`layouts/place/${placeId}`, `layout.msgpack`, Buffer.from(await file.arrayBuffer()));
        await updateAllAttributes("places", {placeId}, {layoutURL});
        return json({ body: { message: 'OK' } });
    }
    catch (err) {
        return json({ body: { message: 'Internal Server Error' } }, { status: 500 });
    }
}