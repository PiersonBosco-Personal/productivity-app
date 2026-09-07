using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProductivityApp.Api.Data;
using ProductivityApp.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// --- Registration: everything the app can build. Nothing runs yet. ---

// Enums cross the wire as their names ("Weekly"), not their ordinals, which is
// what the database stores too. Without this, System.Text.Json uses numbers.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// Route matching is already case-insensitive, but generated URLs are not: the
// [controller] token would put "/api/Calendars" in a Location header.
builder.Services.AddRouting(options => options.LowercaseUrls = true);
builder.Services.AddOpenApi();

// One DbContext per request. The connection string comes from user secrets in
// dev; snake_case keeps Postgres identifiers unquoted while C# stays PascalCase.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default"))
           .UseSnakeCaseNamingConvention());

// Registers UserManager, the password hasher, and the validators.
builder.Services.AddIdentityCore<AppUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 8;
    })
    // Tells Identity where users live.
    .AddEntityFrameworkStores<AppDbContext>()
    // Registers SignInManager, which handles login/logout.
    .AddSignInManager();

// The cookie handler: turns a signed-in user into an encrypted cookie and back.
builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme)
    .AddIdentityCookies();

// AddIdentityCookies already configured these options; this runs after and
// tweaks the same object. By default an unauthorized request gets a 302 to a
// login page that doesn't exist here, so return status codes instead.
builder.Services.Configure<CookieAuthenticationOptions>(
    IdentityConstants.ApplicationScheme,
    options =>
    {
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

// Build() locks the container. Nothing can be registered past this line.
var app = builder.Build();

// --- Pipeline: what each request passes through, in order. ---

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    // Production only. HSTS on localhost would force https on every other
    // local project in the browser, and it is cached for months.
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Reads the cookie and fills HttpContext.User. Rejects nothing on its own.
app.UseAuthentication();
// Enforces [Authorize]. Must come after the line above or it has nothing to check.
app.UseAuthorization();

app.MapControllers();

app.Run();

// Exposes the implicit Program class from the top-level statements above so
// WebApplicationFactory<Program> in the test project can reach it.
public partial class Program;
