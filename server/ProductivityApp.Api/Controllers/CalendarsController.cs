using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivityApp.Api.Data;
using ProductivityApp.Api.Models;

namespace ProductivityApp.Api.Controllers;

// [Authorize] on the class covers every action below, so no anonymous request
// ever reaches the database.
[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CalendarsController(
    AppDbContext db,
    UserManager<AppUser> userManager) : ControllerBase
{
    // Pulls the id claim out of the cookie. [Authorize] guarantees it is there.
    private Guid CurrentUserId => Guid.Parse(userManager.GetUserId(User)!);

    [HttpGet]
    public async Task<ActionResult<List<CalendarResponse>>> GetAll()
    {
        var userId = CurrentUserId;

        // AsNoTracking skips the change tracker: nothing here gets edited.
        return await db.Calendars
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name)
            .Select(c => new CalendarResponse(c.Id, c.Name, c.Color))
            .ToListAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CalendarResponse>> GetById(Guid id)
    {
        var calendar = await FindOwned(id);

        return calendar is null ? NotFound() : Ok(ToResponse(calendar));
    }

    [HttpPost]
    public async Task<ActionResult<CalendarResponse>> Create(CalendarRequest request)
    {
        var calendar = new Calendar
        {
            Name = request.Name.Trim(),
            Color = request.Color,
            UserId = CurrentUserId,
        };

        db.Calendars.Add(calendar);
        // Id is generated here, so it is only safe to read after this line.
        await db.SaveChangesAsync();

        // 201 plus a Location header pointing at GetById above.
        return CreatedAtAction(nameof(GetById), new { id = calendar.Id }, ToResponse(calendar));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, CalendarRequest request)
    {
        var calendar = await FindOwned(id, tracked: true);

        if (calendar is null)
        {
            return NotFound();
        }

        calendar.Name = request.Name.Trim();
        calendar.Color = request.Color;

        // No Update() call needed. EF compares the object to the snapshot it
        // took when loading and writes only the columns that changed.
        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var calendar = await FindOwned(id, tracked: true);

        if (calendar is null)
        {
            return NotFound();
        }

        db.Calendars.Remove(calendar);
        await db.SaveChangesAsync();

        return NoContent();
    }

    // The ownership check lives in one place so no action can forget it. A
    // calendar belonging to someone else comes back null, which reads as 404.
    private Task<Calendar?> FindOwned(Guid id, bool tracked = false)
    {
        var userId = CurrentUserId;
        var query = tracked ? db.Calendars : db.Calendars.AsNoTracking();

        return query.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    }

    private static CalendarResponse ToResponse(Calendar calendar) =>
        new(calendar.Id, calendar.Name, calendar.Color);
}
