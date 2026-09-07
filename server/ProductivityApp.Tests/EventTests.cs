using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace ProductivityApp.Tests;

[Collection("api")]
public class EventTests(ApiFactory factory)
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task An_event_cannot_be_created_in_someone_elses_calendar()
    {
        var owner = await factory.CreateSignedInClientAsync();
        var stranger = await factory.CreateSignedInClientAsync();
        var calendarId = await CreateCalendarAsync(owner);

        // The calendar id travels in the body, so unlike calendars the client
        // gets to choose it. This is the check that stops it mattering.
        var response = await stranger.PostAsJsonAsync("/api/events", new
        {
            calendarId,
            title = "Injected",
            startsAtUtc = "2027-03-01T09:00:00Z",
            endsAtUtc = "2027-03-01T10:00:00Z",
            isAllDay = false,
        }, Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // And nothing was written.
        var ownersEvents = await GetRangeAsync(owner, "2027-03-01T00:00:00Z", "2027-03-02T00:00:00Z");
        Assert.Empty(ownersEvents);
    }

    [Fact]
    public async Task An_event_is_invisible_to_every_other_user()
    {
        var owner = await factory.CreateSignedInClientAsync();
        var stranger = await factory.CreateSignedInClientAsync();

        var calendarId = await CreateCalendarAsync(owner);
        var @event = await CreateEventAsync(owner, calendarId, "2027-04-01T09:00:00Z", "2027-04-01T10:00:00Z", "Private");
        var url = $"/api/events/{@event.Id}";

        // Ownership is two tables away now, so this is really testing the join
        // in EventsController rather than a column comparison.
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.GetAsync(url, Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PutAsJsonAsync(url, new
        {
            calendarId,
            title = "Stolen",
            startsAtUtc = "2027-04-01T11:00:00Z",
            endsAtUtc = "2027-04-01T12:00:00Z",
            isAllDay = false,
        }, Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.DeleteAsync(url, Ct)).StatusCode);

        var stillThere = await owner.GetFromJsonAsync<EventDto>(url, Ct);
        Assert.Equal("Private", stillThere!.Title);
    }

    [Fact]
    public async Task The_range_is_half_open_at_both_ends()
    {
        var client = await factory.CreateSignedInClientAsync();
        var calendarId = await CreateCalendarAsync(client);

        await CreateEventAsync(client, calendarId, "2027-05-01T09:00:00Z", "2027-05-01T10:00:00Z", "Earlier");
        await CreateEventAsync(client, calendarId, "2027-05-01T10:00:00Z", "2027-05-01T11:00:00Z", "Later");

        // "Earlier" ends exactly when this window opens, so it is over.
        var second = await GetRangeAsync(client, "2027-05-01T10:00:00Z", "2027-05-01T11:00:00Z");
        Assert.Equal(["Later"], second.Select(e => e.Title));

        // "Later" starts exactly when this window closes, so it has not begun.
        var first = await GetRangeAsync(client, "2027-05-01T09:00:00Z", "2027-05-01T10:00:00Z");
        Assert.Equal(["Earlier"], first.Select(e => e.Title));

        // A window straddling the boundary catches both, in start order.
        var both = await GetRangeAsync(client, "2027-05-01T09:30:00Z", "2027-05-01T10:30:00Z");
        Assert.Equal(["Earlier", "Later"], both.Select(e => e.Title));
    }

    [Fact]
    public async Task An_event_that_ends_before_it_starts_is_rejected()
    {
        var client = await factory.CreateSignedInClientAsync();
        var calendarId = await CreateCalendarAsync(client);

        var response = await client.PostAsJsonAsync("/api/events", new
        {
            calendarId,
            title = "Backwards",
            startsAtUtc = "2027-06-01T14:00:00Z",
            endsAtUtc = "2027-06-01T13:00:00Z",
            isAllDay = false,
        }, Ct);

        // IValidatableObject rejects it, so the database check constraint never
        // has to. If this ever returns 500, the API-side rule has gone missing.
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("EndsAtUtc", await response.Content.ReadAsStringAsync(Ct));
    }

    private static async Task<Guid> CreateCalendarAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/calendars", new { name = "Cal", color = "#6366f1" }, Ct);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<CalendarDto>(Ct))!.Id;
    }

    private static async Task<EventDto> CreateEventAsync(
        HttpClient client, Guid calendarId, string startsAtUtc, string endsAtUtc, string title)
    {
        var response = await client.PostAsJsonAsync("/api/events", new
        {
            calendarId,
            title,
            startsAtUtc,
            endsAtUtc,
            isAllDay = false,
        }, Ct);

        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<EventDto>(Ct))!;
    }

    private static async Task<List<EventDto>> GetRangeAsync(HttpClient client, string from, string to)
    {
        var url = $"/api/events?from={Uri.EscapeDataString(from)}&to={Uri.EscapeDataString(to)}";

        return (await client.GetFromJsonAsync<List<EventDto>>(url, Ct))!;
    }
}
