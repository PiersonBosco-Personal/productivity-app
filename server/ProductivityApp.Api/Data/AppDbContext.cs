using Microsoft.EntityFrameworkCore;
using ProductivityApp.Api.Models;

namespace ProductivityApp.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Calendar> Calendars => Set<Calendar>();
}
