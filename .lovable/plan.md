# Auto-update bus dates for search

## Problem
- All buses in the database are dated 2026-08-15 (past), so searching for a bus today returns no results.
- The search form's date field defaults to a hardcoded date (2026-04-01) instead of today.
- The daily date-rollover function `auto_update_bus_dates()` exists and pg_cron is installed, but no cron schedule is registered, so dates go stale again.

## Changes

### 1. Database (server side)
- Run `SELECT public.auto_update_bus_dates();` once now — rolls every past bus date to today and resets booked/available seats.
- Register the daily cron job (idempotent: unschedule first, then schedule):
  `SELECT cron.unschedule('auto-update-bus-dates') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='auto-update-bus-dates');`
  `SELECT cron.schedule('auto-update-bus-dates', '0 0 * * *', $$SELECT public.auto_update_bus_dates();$$);`
  Runs at midnight every day, so dates never go stale again.

### 2. Search form (src/components/SearchForm.tsx)
- Default the date field to today's date (computed from the browser at load, in local time).
- Set `min` on the date input to today so past dates can't be picked.

## Verification
- Query the buses table: all dates equal today, seats reset.
- Search in the preview for today's date and confirm buses appear.
- Confirm `cron.job` shows one active daily job.
