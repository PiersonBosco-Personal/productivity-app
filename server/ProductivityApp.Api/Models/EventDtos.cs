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
    }
}

public record EventResponse(
    Guid Id,
    Guid CalendarId,
    string Title,
    string? Description,
    string? Location,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    bool IsAllDay);
