import type { User } from "$lib/type/user";
import { fetchUser } from "./dynamo";


export async function verifyAccess(user:User, intendedRole:string[]): Promise<boolean> {
    let { email } = user;
    const fetchedUser = await fetchUser(email);
    if (!fetchedUser) {
        return false;
    }
    // Add your role-based authorization logic here
    // For example, check if the user has the intendedRole
    return intendedRole.includes(fetchedUser.role);
}