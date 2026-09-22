import { redirect } from 'next/navigation';

export default async function OldGamePage({ params }: { params: Promise<{ slug: string }> }) {
  // Redirect old slug-based routes to the new games lobby
  redirect('/games');
}
