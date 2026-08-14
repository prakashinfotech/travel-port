using PdfSharp.Fonts;

namespace TravelPort.Infrastructure.Services;

public class LinuxFontResolver : IFontResolver
{
    private const string Regular = "LiberationSans-Regular";
    private const string Bold = "LiberationSans-Bold";
    private const string Italic = "LiberationSans-Italic";
    private const string BoldItalic = "LiberationSans-BoldItalic";

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
        return File.ReadAllBytes(ResolveFontPath(faceName));
    }

    private static string ResolveFontPath(string faceName)
    {
        var linuxPath = Path.Combine("/usr/share/fonts/truetype/liberation", $"{faceName}.ttf");
        if (File.Exists(linuxPath)) return linuxPath;

        var windowsFile = faceName switch
        {
            Bold => "arialbd.ttf",
            Italic => "ariali.ttf",
            BoldItalic => "arialbi.ttf",
            _ => "arial.ttf"
        };
        var windowsPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.Windows),
            "Fonts",
            windowsFile);
        if (File.Exists(windowsPath)) return windowsPath;

        throw new FileNotFoundException(
            $"No supported Arial or Liberation Sans font file was found for '{faceName}'. " +
            "Install the Liberation Sans font package in the runtime image.");
    }
}
