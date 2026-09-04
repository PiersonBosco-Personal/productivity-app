using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace ProductivityApp.Api.Models;

public class AppUser : IdentityUser<Guid>
{
    [MaxLength(100)]
    public string? DisplayName { get; set; }
}
