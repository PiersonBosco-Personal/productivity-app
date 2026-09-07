using System.ComponentModel.DataAnnotations;

namespace ProductivityApp.Api.Models;

// Create and update take the same fields, so one request type covers both.
public class CalendarRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    // Six-digit hex only, which is what the client's color picker produces.
    [Required]
    [RegularExpression("^#[0-9a-fA-F]{6}$", ErrorMessage = "Color must look like #6366f1.")]
    public string Color { get; set; } = "";
}

// No UserId here on purpose. The server takes the owner from the cookie and
// never from the request body.
public record CalendarResponse(Guid Id, string Name, string Color);
