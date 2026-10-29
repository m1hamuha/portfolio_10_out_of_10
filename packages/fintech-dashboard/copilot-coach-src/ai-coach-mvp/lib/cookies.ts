import { cookies } from 'next/headers';

export async function getCookie(name: string): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  } catch {
    return undefined;
  }
}

export async function setCookie(
  name: string,
  value: string,
  options?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
  }
) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(name, value, {
      httpOnly: options?.httpOnly ?? true,
      secure: options?.secure ?? process.env.NODE_ENV === 'production',
      sameSite: options?.sameSite ?? 'lax',
      maxAge: options?.maxAge,
      path: options?.path ?? '/',
    });
  } catch {
    // Silently fail if cookies are not available (e.g., in middleware)
  }
}

export async function deleteCookie(name: string, path?: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete({ name, path: path ?? '/' });
  } catch {
    // Silently fail if cookies are not available
  }
}
