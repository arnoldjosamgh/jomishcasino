import { NextResponse } from 'next/server';

// SlotsLaunch API - Free tier, register at https://slotslaunch.com
// Set SLOTSLAUNCH_API_KEY in your .env.local after registering
const SLOTSLAUNCH_API_KEY = process.env.SLOTSLAUNCH_API_KEY || '';
const BASE_URL = 'https://slotslaunch.com/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('per_page') || '24';
  const provider = searchParams.get('provider') || '';
  const type = searchParams.get('type') || '';
  const search = searchParams.get('search') || '';

  // If no API key yet, return rich mock data so the UI is fully functional
  if (!SLOTSLAUNCH_API_KEY) {
    return NextResponse.json({
      success: true,
      mock: true,
      data: getMockGames(parseInt(page), parseInt(perPage), type, search),
      meta: { current_page: parseInt(page), per_page: parseInt(perPage), total: 200, last_page: Math.ceil(200 / parseInt(perPage)) }
    });
  }

  try {
    const params = new URLSearchParams({
      page,
      per_page: perPage,
      ...(provider && { 'provider[]': provider }),
      ...(type && { 'type[]': type }),
    });

    const res = await fetch(`${BASE_URL}/games?token=${SLOTSLAUNCH_API_KEY}&${params}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) throw new Error(`SlotsLaunch API error: ${res.statusText}`);

    const data = await res.json();
    return NextResponse.json({ success: true, ...data });

  } catch (error: any) {
    console.error('SlotsLaunch API error:', error);
    // Graceful fallback to mock data
    return NextResponse.json({
      success: true,
      mock: true,
      data: getMockGames(parseInt(page), parseInt(perPage), type, search),
      meta: { current_page: parseInt(page), per_page: parseInt(perPage), total: 200, last_page: Math.ceil(200 / parseInt(perPage)) }
    });
  }
}

// Rich mock catalog with real game-like entries so the UI looks complete from day 1
function getMockGames(page: number, perPage: number, type: string, search: string) {
  const allGames = [
    // Slots
    { uuid: 'sl-001', title: 'Book of Dead', provider: { title: 'Play\'n GO' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/book-of-dead.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/book-of-dead', rtp: '96.21' },
    { uuid: 'sl-002', title: 'Sweet Bonanza', provider: { title: 'Pragmatic Play' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/sweet-bonanza.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/sweet-bonanza', rtp: '96.51' },
    { uuid: 'sl-003', title: 'Starburst', provider: { title: 'NetEnt' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/starburst.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/starburst', rtp: '96.09' },
    { uuid: 'sl-004', title: 'Gates of Olympus', provider: { title: 'Pragmatic Play' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/gates-of-olympus.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/gates-of-olympus', rtp: '96.5' },
    { uuid: 'sl-005', title: 'Gonzo\'s Quest', provider: { title: 'NetEnt' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/gonzos-quest.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/gonzos-quest', rtp: '95.97' },
    { uuid: 'sl-006', title: 'Big Bass Bonanza', provider: { title: 'Pragmatic Play' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/big-bass-bonanza.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/big-bass-bonanza', rtp: '96.71' },
    { uuid: 'sl-007', title: 'Wolf Gold', provider: { title: 'Pragmatic Play' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/wolf-gold.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/wolf-gold', rtp: '96.01' },
    { uuid: 'sl-008', title: 'Fire Joker', provider: { title: 'Play\'n GO' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/fire-joker.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/fire-joker', rtp: '96.15' },
    { uuid: 'sl-009', title: 'Reactoonz', provider: { title: 'Play\'n GO' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/reactoonz.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/reactoonz', rtp: '96.51' },
    { uuid: 'sl-010', title: 'Razor Shark', provider: { title: 'Push Gaming' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/razor-shark.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/razor-shark', rtp: '96.7' },
    { uuid: 'sl-011', title: 'Legacy of Dead', provider: { title: 'Play\'n GO' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/legacy-of-dead.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/legacy-of-dead', rtp: '96.58' },
    { uuid: 'sl-012', title: 'Wanted Dead or a Wild', provider: { title: 'Hacksaw Gaming' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/wanted-dead-or-a-wild.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/wanted-dead-or-a-wild', rtp: '96.38' },
    { uuid: 'sl-013', title: 'Fruit Party', provider: { title: 'Pragmatic Play' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/fruit-party.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/fruit-party', rtp: '96.47' },
    { uuid: 'sl-014', title: 'Money Train 2', provider: { title: 'Relax Gaming' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/money-train-2.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/money-train-2', rtp: '96.4' },
    { uuid: 'sl-015', title: 'Dead or Alive 2', provider: { title: 'NetEnt' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/dead-or-alive-2.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/dead-or-alive-2', rtp: '96.8' },
    { uuid: 'sl-016', title: 'Dog House Megaways', provider: { title: 'Pragmatic Play' }, technology: 'HTML5', type: 'slots', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/the-dog-house-megaways.webp' }, iframe_url: 'https://www.gamblino.com/en/free-slots/the-dog-house-megaways', rtp: '96.55' },
    // Table Games
    { uuid: 'tg-001', title: 'Blackjack Classic', provider: { title: 'NetEnt' }, technology: 'HTML5', type: 'table', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/blackjack-classic.webp' }, iframe_url: 'https://www.gamblino.com/en/free-blackjack/classic-blackjack', rtp: '99.6' },
    { uuid: 'tg-002', title: 'European Roulette', provider: { title: 'NetEnt' }, technology: 'HTML5', type: 'table', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/european-roulette.webp' }, iframe_url: 'https://www.gamblino.com/en/free-roulette/european-roulette', rtp: '97.3' },
    { uuid: 'tg-003', title: 'American Roulette', provider: { title: 'Microgaming' }, technology: 'HTML5', type: 'table', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/american-roulette.webp' }, iframe_url: 'https://www.gamblino.com/en/free-roulette/american-roulette', rtp: '94.74' },
    { uuid: 'tg-004', title: 'Baccarat Pro', provider: { title: 'NetEnt' }, technology: 'HTML5', type: 'table', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/baccarat-pro.webp' }, iframe_url: 'https://www.gamblino.com/en/free-baccarat/baccarat-pro', rtp: '98.94' },
    { uuid: 'tg-005', title: 'Casino Stud Poker', provider: { title: 'NetEnt' }, technology: 'HTML5', type: 'table', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/casino-stud-poker.webp' }, iframe_url: 'https://www.gamblino.com/en/free-poker/casino-stud-poker', rtp: '94.79' },
    { uuid: 'tg-006', title: 'Three Card Poker', provider: { title: 'Shuffle Master' }, technology: 'HTML5', type: 'table', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/three-card-poker.webp' }, iframe_url: 'https://www.gamblino.com/en/free-poker/three-card-poker', rtp: '96.63' },
    // Video Poker
    { uuid: 'vp-001', title: 'Jacks or Better', provider: { title: 'NetEnt' }, technology: 'HTML5', type: 'video_poker', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/jacks-or-better.webp' }, iframe_url: 'https://www.gamblino.com/en/free-video-poker/jacks-or-better', rtp: '99.54' },
    { uuid: 'vp-002', title: 'Deuces Wild', provider: { title: 'NetEnt' }, technology: 'HTML5', type: 'video_poker', has_demo: true, thumb: { url: 'https://img.cdn.gamblino.com/games/deuces-wild.webp' }, iframe_url: 'https://www.gamblino.com/en/free-video-poker/deuces-wild', rtp: '99.73' },
  ];

  let filtered = [...allGames];
  
  // Filter by type
  if (type && type !== 'all') {
    filtered = filtered.filter(g => g.type === type);
  }

  // Filter by search
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.provider.title.toLowerCase().includes(q)
    );
  }

  const start = (page - 1) * perPage;
  return filtered.slice(start, start + perPage);
}
