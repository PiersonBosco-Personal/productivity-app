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
            .ToTable(t =>
            {
                t.HasCheckConstraint("ck_events_end_after_start", "ends_at_utc > starts_at_utc");
                // A zero or negative interval would make the expander loop on
                // the same instant forever.
                t.HasCheckConstraint("ck_events_recurrence_interval_positive", "recurrence_interval >= 1");
            });

        // Stored as its name rather than its ordinal, so psql stays readable and
        // reordering the enum cannot silently reinterpret existing rows.
        builder.Entity<Event>()
            .Property(e => e.RecurrenceFreq)
            .HasConversion<string>()
            .HasMaxLength(10);

        // Matches the property initialiser, so rows written before this column
        // existed read back as "every 1".
        builder.Entity<Event>()
            .Property(e => e.RecurrenceInterval)
            .HasDefaultValue(1);
    }
}
