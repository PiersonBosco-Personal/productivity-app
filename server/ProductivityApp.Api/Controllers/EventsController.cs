using System.Linq.Expressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivityApp.Api.Data;
using ProductivityApp.Api.Models;

namespace ProductivityApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class EventsController(
    AppDbContext db,
    UserManager<AppUser> userManager) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(userManager.GetUserId(User)!);

    // Held as an Expression, not a lambda, so EF can read it and select only
    // these columns instead of materialising a whole Event.
    private static readonly Expression<Func<Event, EventResponse>> ToResponse =
        e => new EventResponse(
            e.Id, e.CalendarId, e.Title, e.Description, e.Location,
            e.StartsAtUtc, e.EndsAtUtc, e.IsAllDay);

    // GET /api/events?from=…&to=…&calendarId=…
    // DateTimeOffset rather than DateTime: it forces the caller to say what zone
    // they mean, and .UtcDateTime then gives a value Npgsql will accept.
    [HttpGet]
    public async Task<ActionResult<List<EventResponse>>> GetRange(
        //grab query parameters from the URL
        [FromQuery] DateTimeOffset from,
        [FromQuery] DateTimeOffset to,
        [FromQuery] Guid? calendarId)
    {
        if (to <= from)
        {
            return BadRequest("'to' must be after 'from'.");
        }

        var userId = CurrentUserId;
        var fromUtc = from.UtcDateTime;
        var toUtc = to.UtcDateTime;

        return await db.Events
            .AsNoTracking()
            // Reaching through the navigation property becomes a join to calendars.
            .Where(e => e.Calendar.UserId == userId)
            .Where(e => calendarId == null || e.CalendarId == calendarId)
            // Overlap, not containment: anything touching the window counts. Both
            // comparisons are strict because the end is exclusive.
            .Where(e => e.StartsAtUtc < toUtc && e.EndsAtUtc > fromUtc)
            .OrderBy(e => e.StartsAtUtc)
            .Select(ToResponse)
            .ToListAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EventResponse>> GetById(Guid id)
    {
        var userId = CurrentUserId;

        var found = await db.Events
            .AsNoTracking()
            .Where(e => e.Id == id && e.Calendar.UserId == userId)
            .Select(ToResponse)
            .FirstOrDefaultAsync();

        return found is null ? NotFound() : Ok(found);
    }

    [HttpPost]
    public async Task<ActionResult<EventResponse>> Create(EventRequest request)
    {
        var userId = CurrentUserId;

        // The calendar id arrives in the body, so it has to be checked. Without
        // this, anyone could drop an event into someone else's calendar.
        if (!await OwnsCalendarAsync(request.CalendarId, userId))
        {
            return BadRequest("That calendar does not exist.");
        }

        // @ lets a keyword be used as a name. "event" is reserved in C#.
        var @event = new Event
        {
            CalendarId = request.CalendarId,
            Title = request.Title.Trim(),
            Description = request.Description,
            Location = request.Location,
            StartsAtUtc = request.StartsAtUtc,
            EndsAtUtc = request.EndsAtUtc,
            IsAllDay = request.IsAllDay,
        };

        db.Events.Add(@event);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = @event.Id }, new EventResponse(
            @event.Id, @event.CalendarId, @event.Title, @event.Description, @event.Location,
            @event.StartsAtUtc, @event.EndsAtUtc, @event.IsAllDay));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, EventRequest request)
    {
        var userId = CurrentUserId;

        var @event = await db.Events
            .FirstOrDefaultAsync(e => e.Id == id && e.Calendar.UserId == userId);

        if (@event is null)
        {
            return NotFound();
        }

        // Checked again because an update may move the event to another calendar.
        if (!await OwnsCalendarAsync(request.CalendarId, userId))
        {
            return BadRequest("That calendar does not exist.");
        }

        @event.CalendarId = request.CalendarId;
        @event.Title = request.Title.Trim();
        @event.Description = request.Description;
        @event.Location = request.Location;
        @event.StartsAtUtc = request.StartsAtUtc;
        @event.EndsAtUtc = request.EndsAtUtc;
        @event.IsAllDay = request.IsAllDay;

        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = CurrentUserId;

        var @event = await db.Events
            .FirstOrDefaultAsync(e => e.Id == id && e.Calendar.UserId == userId);

        if (@event is null)
        {
            return NotFound();
        }

        db.Events.Remove(@event);
        await db.SaveChangesAsync();

        return NoContent();
    }

    // AnyAsync runs a SELECT EXISTS: no rows come back, just a boolean.
    private Task<bool> OwnsCalendarAsync(Guid calendarId, Guid userId) =>
        db.Calendars.AnyAsync(c => c.Id == calendarId && c.UserId == userId);
}
