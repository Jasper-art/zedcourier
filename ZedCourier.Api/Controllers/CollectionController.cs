using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ZedCourier.Api.Services;

namespace ZedCourier.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Roles = "Clerk,Admin")]
    public class CollectionController : ControllerBase
    {
        private readonly CollectionService _collectionService;

        public CollectionController(CollectionService collectionService)
        {
            _collectionService = collectionService;
        }

        // POST api/v1/collection/verify
        [HttpPost("verify")]
        public async Task<IActionResult> VerifyAndRelease([FromBody] CollectionRequest request)
        {
            var clerkBranchId = Guid.Parse(User.FindFirstValue("branchId")!);
            var clerkUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var (success, message) = await _collectionService.ProcessCollectionAsync(
                request.WaybillNumber,
                request.Pin,
                clerkBranchId,
                clerkUserId
            );

            if (!success)
                return BadRequest(new { error = message });

            return Ok(new { message });
        }
    }

    public class CollectionRequest
    {
        public string WaybillNumber { get; set; } = string.Empty;
        public string Pin { get; set; } = string.Empty;
    }
}