import { DAY1, DAY2 } from './conference'

const REMINDER_MINUTES = 15

export function notificationsSupported() {
  return 'Notification' in window
}

export async function requestPermission() {
  if (!notificationsSupported()) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function permissionGranted() {
  return notificationsSupported() && Notification.permission === 'granted'
}

function parseSessionDateTime(dateStr, timeStr) {
  // dateStr: "2026-05-20", timeStr: "09:00"
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0)
}

const scheduled = new Set()

export function scheduleReminders(schedule) {
  if (!permissionGranted()) return 0
  const now = Date.now()
  let count = 0

  const days = [
    { key: 'day1', date: DAY1 },
    { key: 'day2', date: DAY2 },
  ]

  for (const { key, date } of days) {
    const items = schedule?.[key] ?? []
    for (const item of items) {
      if (!item.time || item.type === 'meal' || item.type === 'flex') continue

      const sessionTime = parseSessionDateTime(date, item.time)
      const reminderTime = sessionTime.getTime() - REMINDER_MINUTES * 60 * 1000

      if (reminderTime <= now) continue

      const id = `${date}-${item.time}-${item.activity}`
      if (scheduled.has(id)) continue
      scheduled.add(id)

      const delay = reminderTime - now
      setTimeout(() => {
        new Notification('HDW 2026 — Starting soon', {
          body: `In ${REMINDER_MINUTES} min: ${item.activity}`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: id,
        })
      }, delay)

      count++
    }
  }

  return count
}

export function clearReminders() {
  scheduled.clear()
}
