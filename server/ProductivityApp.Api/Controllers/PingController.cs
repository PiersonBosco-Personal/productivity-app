using Microsoft.AspNetCore.Mvc;

namespace ProductivityApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PingController : ControllerBase
{
    [HttpGet]
    public ActionResult<object> Get() =>
        Ok(new { message = "pong", at = DateTimeOffset.UtcNow });
}
