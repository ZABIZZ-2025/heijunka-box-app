import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Home() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('heijunka-session')

  if (sessionCookie?.value) {
    redirect('/heijunka')
  } else {
    redirect('/login')
  }
}
