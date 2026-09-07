using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ProductivityApp.Api.Data;
using Testcontainers.PostgreSql;
using Xunit;

namespace ProductivityApp.Tests;

// Boots the real API in memory — real DI, real middleware, real controllers —
// and points it at a throwaway Postgres container. No network, no ports.
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres =
        new PostgreSqlBuilder("postgres:17-alpine").Build();

    public async ValueTask InitializeAsync()
    {
        // Must start first: building the host below reads the connection string
        // this container hands out.
        await _postgres.StartAsync();

        // Same migrations as the real database, so the schema is never guessed.
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Without this the app runs as Production, turns on HTTPS redirection,
        // and answers every plain http test request with a 307.
        builder.UseEnvironment("Development");

        // Added last, so these win over appsettings and the developer's user secrets.
        builder.ConfigureAppConfiguration(config =>
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _postgres.GetConnectionString(),
                // appsettings logs every SQL statement at Information, which buries
                // the assertion failures. Warnings and errors still come through.
                ["Logging:LogLevel:Default"] = "Warning",
                ["Logging:LogLevel:Microsoft.EntityFrameworkCore"] = "Warning",
                ["Logging:LogLevel:Microsoft.Hosting.Lifetime"] = "Warning",
            }));
    }

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    // Registers a brand new user and hands back a client already carrying its
    // auth cookie. Random email so tests never collide.
    public async Task<HttpClient> CreateSignedInClientAsync()
    {
        var client = CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = $"{Guid.NewGuid():N}@example.com",
            password = "Password1!",
            displayName = "Test User",
        });

        response.EnsureSuccessStatusCode();
        return client;
    }
}

// One container and one host shared by every class marked [Collection("api")].
[CollectionDefinition("api")]
public class ApiCollection : ICollectionFixture<ApiFactory>;

// Wire shapes, mirrored from the API's response DTOs.
public record UserDto(Guid Id, string Email, string? DisplayName);

public record CalendarDto(Guid Id, string Name, string Color);

public record EventDto(
    Guid Id,
    Guid CalendarId,
    string Title,
    string? Description,
    string? Location,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    bool IsAllDay);
