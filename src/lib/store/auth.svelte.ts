import type { GoogleUser } from "$lib/type/googleUser";

export const user:GoogleUser =$state(
    {
        email:"",
        name:"",
        picture:""
    }
)