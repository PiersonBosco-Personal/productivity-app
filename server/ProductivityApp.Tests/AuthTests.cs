using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace ProductivityApp.Tests;

[Collection("api")]
public class AuthTests(ApiFactory factory)
{
    // Passed to every awaited call so a cancelled run stops promptly instead of
    // waiting on in-flight requests.
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Register_signs_the_user_in_and_me_returns_them()
    {
        var client = await factory.CreateSignedInClientAsync();

        var response = await client.GetAsync("/api/auth/me", Ct);
        var user = await response.Content.ReadFromJsonAsync<UserDto>(Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Test User", user!.DisplayName);
    }

    [Fact]
    public async Task Me_without_a_cookie_returns_401_and_not_a_redirect()
    {
        // Auto-redirect off on purpose: if the cookie options in Program.cs ever
        // regress to the default 302, the client would quietly follow it and the
        // test would fail on some unrelated status instead of showing the cause.
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        var response = await client.GetAsync("/api/auth/me", Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }
}
