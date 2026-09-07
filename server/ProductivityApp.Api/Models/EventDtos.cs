using System.ComponentModel.DataAnnotations;

namespace ProductivityApp.Api.Models;

// IValidatableObject adds the rules attributes cannot express: comparing two
// fields, and checking a DateTime's Kind.
public class EventRequest : IValidatableObject
{
    public Guid CalendarId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = "";

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    public DateTime StartsAtUtc { get; set; }

    public DateTime EndsAtUtc { get; set; }

    public bool IsAllDay { get; set; }

    // Null keeps the event a one-off. The other two are ignored when it is null.
    public RecurrenceFreq? RecurrenceFreq { get; set; }

    public int RecurrenceInterval { get; set; } = 1;

    public DateTime? RecurrenceUntilUtc { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // A time without a "Z" deserializes as Unspecified, which Npgsql refuses
        // to write. Catching it here gives a 400 instead of a 500.
        if (StartsAtUtc.Kind != DateTimeKind.Utc || EndsAtUtc.Kind != DateTimeKind.Utc)
        {
            yield return new ValidationResult(
                "Times must be UTC and end in 'Z'.",
                [nameof(StartsAtUtc), nameof(EndsAtUtc)]);
        }

        // Mirrors the ck_events_end_after_start constraint in the database.
        if (EndsAtUtc <= StartsAtUtc)
        {
            yield return new ValidationResult(
                "The end must be after the start.",
                [nameof(EndsAtUtc)]);
        }

        // Mirrors ck_events_recurrence_interval_positive. A zero interval would
        // make the expander loop forever on the same instant.
        if (RecurrenceInterval < 1)
        {
            yield return new ValidationResult(
                "The repeat interval must be at least 1.",
                [nameof(RecurrenceInterval)]);
        }

        if (RecurrenceUntilUtc is { } until)
        {
            if (until.Kind != DateTimeKind.Utc)
            {
                yield return new ValidationResult(
                    "Times must be UTC and end in 'Z'.",
                    [nameof(RecurrenceUntilUtc)]);
            }

            // Until is exclusive, so it has to clear the first occurrence's
            // start or the series would contain nothing at all.
            if (until <= StartsAtUtc)
            {
                yield return new ValidationResult(
                    "The repeat end must be after the start.",
                    [nameof(RecurrenceUntilUtc)]);
            }
        }
    }
}

// Every occurrence of a series carries the series' own id, so a client keys a
// row on (id, startsAtUtc). That pair is also what an override will be filed
// under once single-occurrence edits exist.
//
// SeriesStartsAtUtc is the stored row's own start — the first occurrence. An
// editor needs it to change a series without moving it to whichever occurrence
// happened to be on screen. On a one-off it is just StartsAtUtc.
public record EventResponse(
    Guid Id,
    Guid CalendarId,
    string Title,
    string? Description,
    string? Location,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    bool IsAllDay,
    RecurrenceFreq? RecurrenceFreq,
    int RecurrenceInterval,
    DateTime? RecurrenceUntilUtc,
    DateTime SeriesStartsAtUtc)
{
    // One mapping for both a stored row and an expanded occurrence: the
    // occurrence overrides only the two times.
    public static EventResponse From(Event e, DateTime? startsAtUtc = null, DateTime? endsAtUtc = null) =>
        new(e.Id, e.CalendarId, e.Title, e.Description, e.Location,
            startsAtUtc ?? e.StartsAtUtc, endsAtUtc ?? e.EndsAtUtc, e.IsAllDay,
            e.RecurrenceFreq, e.RecurrenceInterval, e.RecurrenceUntilUtc, e.StartsAtUtc);
}
