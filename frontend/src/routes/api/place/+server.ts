// /api/place/+server.ts
import { json, type RequestHandler } from "@sveltejs/kit";
import { addFile } from "$lib/scripts/server/s3";
import { addDataUniqueId, fetchAllData, fetchData, updateAllAttributes } from "$lib/scripts/server/dynamo";
import type { User } from "$lib/type/user";
import type { Place } from "$lib/type/place";
import path from "node:path";
import { v4 as uuid4} from "uuid";
import { encode } from "@msgpack/msgpack";
import { guard } from "$lib/scripts/server/guard";

interface PlaceFormData {
    placeId?: string;
    name: string;
    location: string;
    description?: string;
    creatorId?: string;
    creatorName?: string;
    picture?: File;
    layoutURL?: string;
}


async function formatData(data:PlaceFormData, creator:User) {
    let place:Place = {
        placeId:data.placeId,
        creatorId:creator.googleId,
        creatorName: creator.name,
        description:data.description,
        name: data.name,
        location: await fetchData('locations', {locationId: data.location}),
    } as Place

    return place
}

export const GET: RequestHandler = async (event) => {
    const user = await guard(event, ['admin', 'organizer']);
    if (user instanceof Response) return user;
    
    try {
        const data = await fetchAllData('places');
        return json({ body: { data } });
    } catch (error) {
        console.error('Error fetching places:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}


export const POST: RequestHandler = async (event) => {
  const user = await guard(event, ['admin']);
  if (user instanceof Response) return user;
 
  try {
    const formData = await event.request.formData();
    const location = await fetchData('locations', { locationId: formData.get('location') as string });
    const picture = formData.get('picture') as File | null;
 
    let pictureURL = '';
    if (picture && picture.size > 0) {
      const buffer = Buffer.from(await picture.arrayBuffer());
      pictureURL = await addFile(
        `pictures/place`,`${Date.now()}-${uuid4()}${path.extname(picture.name)}`,
        buffer
      );
    }
 
    const uniqueId = await addDataUniqueId(
      'places',
      {
        name: formData.get('name'),
        picture: pictureURL,
        location,
        creatorId: user.googleId,
        creatorName: user.name
      },
      'placeId'
    );
 
    const initialLayout = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      canvas: { gridWidth: 80, gridHeight: 80 },
      objects: []
    };
    await addFile(`layouts/place/`,`${uniqueId}.msgpack`, Buffer.from(encode(initialLayout)));
 
    return json({ body: { message: 'ok', placeId: uniqueId } });
  } catch (error) {
    console.error('Error creating place:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PATCH: RequestHandler = async (event) => {
  const user = await guard(event, ['admin']);
  if (user instanceof Response) return user;
 
  try {
    const data = Object.fromEntries(await event.request.formData()) as unknown as PlaceFormData;
    const processData = {} as Place;
 
    const picture = data.picture;
    if (picture && picture.size > 0) {
      const buffer = Buffer.from(await picture.arrayBuffer());
      processData.picture = await addFile(
        `pictures/place/`,`${data.placeId}${path.extname(picture.name)}`,
        buffer
      );
    }
    delete data.picture;
 
    Object.assign(processData, await formatData(data, user));
    await updateAllAttributes('places', { placeId: processData.placeId }, processData);
 
    return json({ body: { message: 'OK' } });
  } catch (error) {
    console.error('Error updating place:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};