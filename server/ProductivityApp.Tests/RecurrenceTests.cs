using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using ProductivityApp.Api.Models;
using ProductivityApp.Api.Services;
using Xunit;

namespace ProductivityApp.Tests;

// The expander is a pure function, so most of this needs no HTTP and no
// database. The last two tests are the ones that do: they cover the range
// query and the window guard around it.
[Collection("api")]
public class RecurrenceTests(ApiFactory factory)
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public void A_series_repeats_every_interval_weeks()
    {
        var series = Series("2027-01-04T09:00:00Z", "2027-01-04T10:00:00Z", RecurrenceFreq.Weekly, interval: 2);

        var starts = Expand(series, "2027-01-04T00:00:00Z", "2027-02-01T00:00:00Z");

        // The 1st of February would be the next one, but the window end is
        // exclusive, so it belongs to the following page.
        Assert.Equal(["2027-01-04T09:00:00Z", "2027-01-18T09:00:00Z"], starts);
    }

    [Fact]
    public void A_monthly_series_clamps_short_months_without_drifting()
    {
        var series = Series("2027-01-31T09:00:00Z", "2027-01-31T10:00:00Z", RecurrenceFreq.Monthly);

        var starts = Expand(series, "2027-01-01T00:00:00Z", "2027-05-01T00:00:00Z");

        // February clamps to the 28th and March goes back to the 31st. Stepping
        // from the previous occurrence instead of the original start would have
        // left the whole series stuck on the 28th.
        Assert.Equal(
            ["2027-01-31T09:00:00Z", "2027-02-28T09:00:00Z", "2027-03-31T09:00:00Z", "2027-04-30T09:00:00Z"],
            starts);
    }

    [Fact]
    public void Until_is_exclusive()
    {
        var series = Series(
            "2027-03-01T09:00:00Z", "2027-03-01T10:00:00Z", RecurrenceFreq.Daily,
            untilUtc: "2027-03-04T09:00:00Z");

        var starts = Expand(series, "2027-03-01T00:00:00Z", "2027-04-01T00:00:00Z");

        // An occurrence starting exactly on Until is not part of the series.
        Assert.Equal(
            ["2027-03-01T09:00:00Z", "2027-03-02T09:00:00Z", "2027-03-03T09:00:00Z"],
            starts);
    }

    [Fact]
    public void An_occurrence_already_running_when_the_window_opens_is_included()
    {
        // Crosses midnight, so the occurrence that matters started yesterday.
        var series = Series("2027-07-01T23:00:00Z", "2027-07-02T01:00:00Z", RecurrenceFreq.Daily);

        var starts = Expand(series, "2027-07-05T00:00:00Z", "2027-07-05T12:00:00Z");

        // This is what the jump-ahead in FirstIndex must not skip past.
        Assert.Equal(["2027-07-04T23:00:00Z"], starts);
    }

    [Fact]
    public async Task A_series_is_expanded_over_the_requested_window()
    {
        var client = await factory.CreateSignedInClientAsync();
        var calendarId = await CreateCalendarAsync(client);

        var response = await client.PostAsJsonAsync("/api/events", new
        {
            calendarId,
            title = "Standup",
            startsAtUtc = "2028-01-03T09:00:00Z",
            endsAtUtc = "2028-01-03T09:15:00Z",
            isAllDay = false,
            recurrenceFreq = "Daily",
            recurrenceInterval = 1,
        }, Ct);

        response.EnsureSuccessStatusCode();
        var created = (await response.Content.ReadFromJsonAsync<EventDto>(Ct))!;

        // Six months after the stored row's end: only the recurrence columns can
        // put this in the window, so this is really testing the range query.
        var url = "/api/events?from=2028-06-01T00:00:00Z&to=2028-06-04T00:00:00Z";
        var occurrences = (await client.GetFromJsonAsync<List<EventDto>>(url, Ct))!;

        Assert.Equal(
            ["2028-06-01T09:00:00Z", "2028-06-02T09:00:00Z", "2028-06-03T09:00:00Z"],
            occurrences.Select(Iso));

        // Every occurrence carries the series' id: the row is still one row.
        Assert.All(occurrences, o => Assert.Equal(created.Id, o.Id));
    }

    [Fact]
    public async Task A_window_longer_than_a_year_is_rejected()
    {
        var client = await factory.CreateSignedInClientAsync();

        // An open-ended series would otherwise be expanded once per day of it.
        var response = await client.GetAsync(
            "/api/events?from=2028-01-01T00:00:00Z&to=2030-01-01T00:00:00Z", Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static Event Series(
        string startsAtUtc, string endsAtUtc, RecurrenceFreq freq,
        int interval = 1, string? untilUtc = null) => new()
        {
            Id = Guid.NewGuid(),
            CalendarId = Guid.NewGuid(),
            Title = "Repeating",
            StartsAtUtc = Utc(startsAtUtc),
            EndsAtUtc = Utc(endsAtUtc),
            RecurrenceFreq = freq,
            RecurrenceInterval = interval,
            RecurrenceUntilUtc = untilUtc is null ? null : Utc(untilUtc),
        };

    private static List<string> Expand(Event series, string from, string to) =>
        RecurrenceExpander.Expand(series, Utc(from), Utc(to)).Select(Iso).ToList();

    private static DateTime Utc(string value) =>
        DateTimeOffset.Parse(value, CultureInfo.InvariantCulture).UtcDateTime;

    private static string Iso(EventResponse occurrence) => Iso(occurrence.StartsAtUtc);

    private static string Iso(EventDto occurrence) => Iso(occurrence.StartsAtUtc);

    // Compared as strings so a failure prints the times instead of two ticks counts.
    private static string Iso(DateTime value) =>
        value.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture);

    private static async Task<Guid> CreateCalendarAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/calendars", new { name = "Cal", color = "#6366f1" }, Ct);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<CalendarDto>(Ct))!.Id;
    }
}
