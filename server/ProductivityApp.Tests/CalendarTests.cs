using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace ProductivityApp.Tests;

[Collection("api")]
public class CalendarTests(ApiFactory factory)
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Create_returns_201_with_a_location_header_and_shows_up_in_the_list()
    {
        var client = await factory.CreateSignedInClientAsync();

        var created = await client.PostAsJsonAsync("/api/calendars", new { name = "Personal", color = "#6366f1" }, Ct);
        var calendar = await created.Content.ReadFromJsonAsync<CalendarDto>(Ct);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        // The header CreatedAtAction built from the GetById route template.
        Assert.Equal($"/api/calendars/{calendar!.Id}", created.Headers.Location?.AbsolutePath);

        var list = await client.GetFromJsonAsync<List<CalendarDto>>("/api/calendars", Ct);
        Assert.Contains(list!, c => c.Id == calendar.Id && c.Name == "Personal");
    }

    [Fact]
    public async Task A_calendar_is_invisible_to_every_other_user()
    {
        var owner = await factory.CreateSignedInClientAsync();
        var stranger = await factory.CreateSignedInClientAsync();

        var created = await owner.PostAsJsonAsync("/api/calendars", new { name = "Private", color = "#111111" }, Ct);
        var calendar = await created.Content.ReadFromJsonAsync<CalendarDto>(Ct);
        var url = $"/api/calendars/{calendar!.Id}";

        // 404 and not 403 on all three: a 403 would confirm the row exists.
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.GetAsync(url, Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await stranger.PutAsJsonAsync(url, new { name = "Stolen", color = "#222222" }, Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.DeleteAsync(url, Ct)).StatusCode);

        // None of that touched the real thing.
        var stillThere = await owner.GetFromJsonAsync<CalendarDto>(url, Ct);
        Assert.Equal("Private", stillThere!.Name);

        // And the stranger's own list never included it.
        Assert.Empty((await stranger.GetFromJsonAsync<List<CalendarDto>>("/api/calendars", Ct))!);
    }

    [Fact]
    public async Task A_bad_colour_is_rejected_before_the_action_runs()
    {
        var client = await factory.CreateSignedInClientAsync();

        var response = await client.PostAsJsonAsync("/api/calendars", new { name = "Bad", color = "blue" }, Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Color", await response.Content.ReadAsStringAsync(Ct));
    }
}
