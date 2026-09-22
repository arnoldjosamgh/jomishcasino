import { NextResponse } from 'next/server';

const API_KEY = process.env.ODDS_API_KEY || 'demo_key_placeholder'; // Free tier key
const BASE_URL = 'https://api.the-odds-api.com/v4';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'soccer_epl'; // Default to EPL
    const region = searchParams.get('region') || 'uk';
    
    // In demo mode or if no valid API key, return mock data so UI still functions
    if (API_KEY === 'demo_key_placeholder' || process.env.NODE_ENV === 'development') {
       return NextResponse.json({
         success: true,
         data: getMockOdds(sport)
       });
    }

    const response = await fetch(
      `${BASE_URL}/sports/${sport}/odds/?apiKey=${API_KEY}&regions=${region}&markets=h2h&oddsFormat=decimal`,
      { next: { revalidate: 300 } } // Cache for 5 mins to save free quota
    );

    if (!response.ok) {
      throw new Error(`Odds API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Failed to fetch odds:', error);
    
    // Fallback to mock data gracefully
    return NextResponse.json({
      success: true,
      fallback: true,
      data: getMockOdds('soccer_epl')
    });
  }
}

function getMockOdds(sport: string) {
  const isFootball = sport.includes('soccer');
  return [
    {
      id: 'mock_1',
      sport_key: sport,
      sport_title: isFootball ? 'Premier League' : 'Basketball',
      commence_time: new Date(Date.now() + 3600000).toISOString(),
      home_team: isFootball ? 'Arsenal' : 'Lakers',
      away_team: isFootball ? 'Chelsea' : 'Warriors',
      bookmakers: [
        {
          key: 'jomish_sports',
          title: 'Jomish Sports',
          markets: [
            {
              key: 'h2h',
              outcomes: [
                { name: isFootball ? 'Arsenal' : 'Lakers', price: 2.15 },
                { name: isFootball ? 'Chelsea' : 'Warriors', price: 3.40 },
                ...(isFootball ? [{ name: 'Draw', price: 3.10 }] : [])
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'mock_2',
      sport_key: sport,
      sport_title: isFootball ? 'Premier League' : 'Basketball',
      commence_time: new Date(Date.now() + 7200000).toISOString(),
      home_team: isFootball ? 'Man City' : 'Bulls',
      away_team: isFootball ? 'Liverpool' : 'Celtics',
      bookmakers: [
        {
          key: 'jomish_sports',
          title: 'Jomish Sports',
          markets: [
            {
              key: 'h2h',
              outcomes: [
                { name: isFootball ? 'Man City' : 'Bulls', price: 1.85 },
                { name: isFootball ? 'Liverpool' : 'Celtics', price: 4.20 },
                ...(isFootball ? [{ name: 'Draw', price: 3.60 }] : [])
              ]
            }
          ]
        }
      ]
    }
  ];
}
