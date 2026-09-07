using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace ProductivityApp.Api.Models;

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
}
