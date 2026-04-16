namespace ZedCourier.Api.Services
{
    public static class TokenBlacklistService
    {
        private static readonly HashSet<string> _revokedTokens = new();

        public static void RevokeToken(string token)
        {
            if (!string.IsNullOrEmpty(token))
                _revokedTokens.Add(token);
        }

        public static bool IsTokenRevoked(string token)
        {
            return _revokedTokens.Contains(token);
        }

        public static void ClearExpiredTokens()
        {
            // Optional: Implement token expiry cleanup
            // For now, tokens clear on app restart
        }
    }
}