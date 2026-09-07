using ProductivityApp.Api.Models;

namespace ProductivityApp.Api.Services;

// Expand on read: the database holds one row per series, and the occurrences
// only ever exist in memory, produced here for the window being viewed.
public static class RecurrenceExpander
{
    // Yields every occurrence of the series that overlaps [fromUtc, toUtc).
    // Same half-open rule as the range query: an occurrence ending exactly at
    // fromUtc, or starting exactly at toUtc, is outside the window.
    public static IEnumerable<EventResponse> Expand(Event series, DateTime fromUtc, DateTime toUtc)
    {
        if (series.RecurrenceFreq is not { } freq)
        {
            yield return EventResponse.From(series);
            yield break;
        }

        // Every occurrence keeps the length of the stored one.
        var duration = series.EndsAtUtc - series.StartsAtUtc;
        // The check constraint rules 0 out, but a 0 here would spin forever.
        var interval = Math.Max(1, series.RecurrenceInterval);

        // Start near the window instead of walking every occurrence since the
        // series began. FirstIndex may undershoot, never overshoot, so the
        // overlap test below is what actually decides.
        for (var n = FirstIndex(freq, interval, series.StartsAtUtc, duration, fromUtc); ; n++)
        {
            var starts = Advance(freq, series.StartsAtUtc, interval * n);

            if (starts >= toUtc)
            {
                yield break;
            }

            // Until is exclusive: an occurrence starting on it is not in the series.
            if (series.RecurrenceUntilUtc is { } until && starts >= until)
            {
                yield break;
            }

            if (starts + duration > fromUtc)
            {
                yield return EventResponse.From(series, starts, starts + duration);
            }
        }
    }

    // AddMonths clamps: a series starting the 31st lands on the 30th in a short
    // month. Always advancing from the original start means the next long month
    // comes back to the 31st instead of the drift a running total would give.
    private static DateTime Advance(RecurrenceFreq freq, DateTime start, int steps) => freq switch
    {
        RecurrenceFreq.Daily => start.AddDays(steps),
        RecurrenceFreq.Weekly => start.AddDays(7 * steps),
        RecurrenceFreq.Monthly => start.AddMonths(steps),
        _ => throw new ArgumentOutOfRangeException(nameof(freq)),
    };

    // The index of an occurrence at or before the first one that can touch the
    // window. Deliberately biased low: too small only costs a loop turn, too
    // large would silently drop occurrences.
    private static int FirstIndex(
        RecurrenceFreq freq, int interval, DateTime start, TimeSpan duration, DateTime fromUtc)
    {
        // An occurrence is in the window when starts + duration > fromUtc, so
        // this is how far past the stored occurrence's end the window begins.
        // Kept as a TimeSpan: a DateTime subtraction here could run off the end
        // of the calendar for a long enough event.
        var gap = fromUtc - start - duration;
        if (gap <= TimeSpan.Zero)
        {
            return 0;
        }

        var steps = freq switch
        {
            RecurrenceFreq.Daily => (int)(gap.TotalDays / interval),
            RecurrenceFreq.Weekly => (int)(gap.TotalDays / 7 / interval),
            // Months are not a fixed length, so this one is an estimate. The
            // back-off keeps it under the true answer: one step for the
            // rounding, plus however many months the event itself spans.
            RecurrenceFreq.Monthly =>
                ((((fromUtc.Year - start.Year) * 12) + fromUtc.Month - start.Month) / interval)
                    - 1 - (int)(duration.TotalDays / 28),
            _ => 0,
        };

        return Math.Max(0, steps);
    }
}
