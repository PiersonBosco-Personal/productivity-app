using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace ProductivityApp.Api.Models;

// Only what a calendar UI actually offers a button for. Anything richer
// ("every third Thursday") needs a real RRULE parser; this is not one.
public enum RecurrenceFreq
{
    Daily,
    Weekly,
    Monthly,
}

// Every query is "events in these calendars, in this window", so the composite
// index matches that shape rather than indexing the two columns separately.
[Index(nameof(CalendarId), nameof(StartsAtUtc))]
public class Event
{
    public Guid Id { get; set; }

    // Ownership is reached through the calendar, so there is no UserId here.
    public Guid CalendarId { get; set; }
    // Adds the Calendar navigation property to the EF model so that Include(e => e.Calendar) works.
    public Calendar Calendar { get; set; } = null!;

    [Required, MaxLength(200)]
    public string Title { get; set; } = "";

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    // Always UTC. Npgsql rejects a DateTime with any other Kind at write time,
    // and the Utc suffix keeps that obvious at every call site.
    public DateTime StartsAtUtc { get; set; }

    // Exclusive: a 9-10 event and a 10-11 event do not overlap.
    public DateTime EndsAtUtc { get; set; }

    // Stored as UTC midnight to UTC midnight. Only changes how it is rendered.
    public bool IsAllDay { get; set; }

    // Null means a one-off. When set, this row is the whole series: only the
    // first occurrence is stored, the rest are expanded on read.
    public RecurrenceFreq? RecurrenceFreq { get; set; }

    // Every interval-th day/week/month. 1 unless the user wants "every other".
    public int RecurrenceInterval { get; set; } = 1;

    // Exclusive, like every other end in this schema: an occurrence starting
    // exactly here is not part of the series. Null repeats forever.
    public DateTime? RecurrenceUntilUtc { get; set; }
}
