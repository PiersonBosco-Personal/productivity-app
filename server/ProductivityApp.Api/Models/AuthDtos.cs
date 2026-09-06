using System.ComponentModel.DataAnnotations;

namespace ProductivityApp.Api.Models;

// What the browser sends up. The attributes are the validation rules —
// [ApiController] checks them and returns 400 before the action ever runs.
public class RegisterRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = "";

    [Required, MinLength(8)]
    public string Password { get; set; } = "";

    [MaxLength(100)]
    public string? DisplayName { get; set; }
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";
}

// What we send back. Kept separate from AppUser on purpose: the entity carries
// the password hash and security stamps, which must never reach the client.
public record UserResponse(Guid Id, string Email, string? DisplayName);
