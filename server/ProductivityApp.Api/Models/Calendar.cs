using System.ComponentModel.DataAnnotations;

namespace ProductivityApp.Api.Models;

public class Calendar
{
    public Guid Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    [Required, MaxLength(7)]
    public string Color { get; set; } = "#6366f1";
}
