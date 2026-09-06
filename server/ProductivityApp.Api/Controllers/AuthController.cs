using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProductivityApp.Api.Models;

namespace ProductivityApp.Api.Controllers;

// [controller] expands to the class name minus "Controller" -> /api/auth.
// ControllerBase instead of Controller: no view rendering, this is an API.
[ApiController]
[Route("api/[controller]")]
public class AuthController(
    // Both are injected per request. AddIdentityCore + AddSignInManager in
    // Program.cs are what put them in the container.
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<UserResponse>> Register(RegisterRequest request)
    {
        var user = new AppUser
        {
            // Identity keys off UserName, so mirror the email into it.
            UserName = request.Email,
            Email = request.Email,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? null : request.DisplayName.Trim(),
        };

        // Runs the password rules, hashes it, and saves the row.
        var result = await userManager.CreateAsync(user, request.Password);

        // Identity reports failure as a result object, not an exception.
        if (!result.Succeeded)
        {
            return BadRequest(string.Join(" ", result.Errors.Select(e => e.Description)));
        }

        // Sign the new user in right away so they skip the login screen.
        await signInManager.SignInAsync(user, isPersistent: true);

        return Ok(ToResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserResponse>> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);

        // Same message for a missing user and a bad password, so this endpoint
        // can't be used to find out which emails are registered.
        if (user is null)
        {
            return Unauthorized("Invalid email or password");
        }

        // Checks lockout, verifies the hash, then writes the auth cookie.
        var result = await signInManager.PasswordSignInAsync(
            user, request.Password, isPersistent: true, lockoutOnFailure: true);

        // Five bad passwords locks the account for five minutes.
        if (result.IsLockedOut)
        {
            return Unauthorized("Too many failed attempts. Try again in a few minutes.");
        }

        if (!result.Succeeded)
        {
            return Unauthorized("Invalid email or password");
        }

        return Ok(ToResponse(user));
    }

    // [Authorize] rejects anonymous requests before the body runs.
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        // Sends back an already-expired cookie.
        await signInManager.SignOutAsync();
        return NoContent();
    }

    // The client calls this on page load to ask "am I still signed in?"
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> Me()
    {
        // User is the ClaimsPrincipal decrypted from the cookie by
        // UseAuthentication. This reads the id claim out of it and loads the row.
        var user = await userManager.GetUserAsync(User);

        return user is null ? Unauthorized() : Ok(ToResponse(user));
    }

    // Entity -> wire shape. Everything not listed here stays on the server.
    private static UserResponse ToResponse(AppUser user) =>
        new(user.Id, user.Email!, user.DisplayName);
}
