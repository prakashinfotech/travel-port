namespace TravelPort.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
    public PaginationMeta? Meta { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "Success")
        => new() { Success = true, Message = message, Data = data };

    public static ApiResponse<T> Fail(string message, List<string>? errors = null)
        => new() { Success = false, Message = message, Errors = errors };

    public static ApiResponse<T> Paged(T data, int page, int pageSize, int total)
        => new()
        {
            Success = true,
            Message = "Success",
            Data = data,
            Meta = new PaginationMeta(page, pageSize, total)
        };
}

public record PaginationMeta(int Page, int PageSize, int Total)
{
    public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);
}
