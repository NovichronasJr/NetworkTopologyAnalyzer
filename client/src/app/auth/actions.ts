
'use server'
import { cookies } from 'next/headers'
import { redirect} from 'next/navigation'

export async function handleLoginSuccess(token) {
  
  const cookieStore = await cookies();
  
  const ONE_HOUR = 3600;

  await cookieStore.set('session-token', token, {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_NODE_ENV === 'production', 
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_HOUR, 
  });
}


export async function handleLogout() {
  const cookieStore = await cookies();
  await cookieStore.delete('session-token');
  redirect('/auth/login');
}

