using System.Globalization;
using System.Text;

namespace TeamFlow.Application.Common;

/// <summary>Derives URL slugs and short workspace keys from human names. Pure; uniqueness is the caller's job.</summary>
public static class Slugger
{
    /// <summary>"Acme Engineering!" → "acme-engineering". Diacritics stripped, runs of non-alphanumerics collapsed.</summary>
    public static string ToSlug(string input)
    {
        var normalized = (input ?? string.Empty).Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);
        var lastWasDash = false;
        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark)
                continue;
            if (char.IsLetterOrDigit(ch))
            {
                sb.Append(char.ToLowerInvariant(ch));
                lastWasDash = false;
            }
            else if (!lastWasDash && sb.Length > 0)
            {
                sb.Append('-');
                lastWasDash = true;
            }
        }
        return sb.ToString().Trim('-') is { Length: > 0 } s ? s : "workspace";
    }

    /// <summary>"Acme Engineering" → "ACME": first word's alphanumerics, uppercased, max 4 chars.</summary>
    public static string ToKey(string input)
    {
        var firstWord = (input ?? string.Empty)
            .Split([' ', '-', '_'], StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault(w => w.Any(char.IsLetterOrDigit));
        if (firstWord is null)
            return "WS";

        var key = new string(firstWord.Where(char.IsLetterOrDigit).Take(4).ToArray()).ToUpperInvariant();
        return key.Length >= 2 ? key : "WS";
    }
}
