using PdfSharpCore.Fonts;

namespace TravelPort.Infrastructure.Services;

public class LinuxFontResolver : IFontResolver
{
    private const string Regular = "LiberationSans-Regular";
    private const string Bold = "LiberationSans-Bold";
    private const string Italic = "LiberationSans-Italic";
    private const string BoldItalic = "LiberationSans-BoldItalic";

    private static readonly string FontDir = "/usr/share/fonts/truetype/liberation";

    public string DefaultFontName => "Arial";

    public FontResolverInfo ResolveTypeface(string familyName, bool isBold, bool isItalic)
    {
        return (isBold, isItalic) switch
        {
            (true, true)  => new FontResolverInfo(BoldItalic),
            (true, false) => new FontResolverInfo(Bold),
            (false, true) => new FontResolverInfo(Italic),
            _             => new FontResolverInfo(Regular)
        };
    }

    public byte[] GetFont(string faceName)
    {
        var path = Path.Combine(FontDir, $"{faceName}.ttf");
        return File.ReadAllBytes(path);
    }
}
