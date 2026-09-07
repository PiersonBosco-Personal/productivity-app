using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProductivityApp.Api.Models;

namespace ProductivityApp.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Calendar> Calendars => Set<Calendar>();

    public DbSet<Event> Events => Set<Event>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Identity configures its own tables in here. Skipping this breaks them.
        base.OnModelCreating(builder);

        // The API validates this too, but the constraint is what holds when a
        // future endpoint or a migration forgets to.
        builder.Entity<Event>()
            .ToTable(t => t.HasCheckConstraint("ck_events_end_after_start", "ends_at_utc > starts_at_utc"));
    }
}
