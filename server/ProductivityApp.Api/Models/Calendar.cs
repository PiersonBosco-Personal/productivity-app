using System.ComponentModel.DataAnnotations;

namespace ProductivityApp.Api.Models;

public class Calendar
{
    public Guid Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    [Required, MaxLength(7)]
    public string Color { get; set; } = "#6366f1";

    // Who owns this calendar. EF pairs UserId with the User property below and
    // builds the foreign key itself: required, indexed, deletes with the user.
    public Guid UserId { get; set; }

    // Only populated when a query asks for it. Left alone it stays null.
    public AppUser User { get; set; } = null!;
}
