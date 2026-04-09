using System.Security.Cryptography;
using System.Text;
using System;

namespace ZedCourier.Api.Helpers
{
    public static class SecurityHelper
    {
        // Generates a random 4-digit PIN for the client
        public static string GeneratePin()
        {
            Random random = new Random();
            return random.Next(1000, 9999).ToString();
        }

        // Hashes the PIN for safe database storage
        public static string HashPin(string pin)
        {
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(pin));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }

        // Verifies the entered PIN against the hash in the database
        public static bool VerifyPin(string inputPin, string savedHash)
        {
            string hashOfInput = HashPin(inputPin);
            return StringComparer.OrdinalIgnoreCase.Compare(hashOfInput, savedHash) == 0;
        }
    }
}