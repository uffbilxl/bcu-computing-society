import { fetchGoogleCalendarEvents } from '@/lib/googleCalendar'
import { FALLBACK_EVENTS } from './fallbackEvents'
import { EventsClient } from './EventsClient'

/* Re-read the calendar every 15 minutes. The page stays static between
 * reads, so a visitor never waits on Google. */
export const revalidate = 900

export default async function EventsPage() {
  const synced = await fetchGoogleCalendarEvents()
  return <EventsClient events={synced ?? FALLBACK_EVENTS} />
}
