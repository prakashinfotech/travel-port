CREATE PROCEDURE [dbo].[usp_SearchFlights]
    @Source         NVARCHAR(10),
    @Destination    NVARCHAR(10),
    @DepartureDate  DATE,
    @Passengers     INT          = 1,
    @Class          NVARCHAR(20) = 'Economy',
    @SortBy         NVARCHAR(20) = 'Price',   -- Price | Duration | Departure
    @PageNumber     INT          = 1,
    @PageSize       INT          = 10
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT
        f.[Id] AS [FlightId],
        f.[Airline],
        f.[FlightNumber],
        f.[Source],
        f.[Destination],
        f.[DepartureTime],
        f.[ArrivalTime],
        f.[Duration],
        f.[AvailableSeats],
        f.[Stops],
        CASE @Class
            WHEN 'Business' THEN f.[BusinessPrice]
            ELSE f.[EconomyPrice]
        END                                AS [Price],
        COUNT(1) OVER ()                   AS [TotalCount]
    FROM [dbo].[Flights] f
    WHERE
        f.[Source]                     = @Source
        AND f.[Destination]            = @Destination
        AND CAST(f.[DepartureTime] AS DATE) = @DepartureDate
        AND f.[AvailableSeats]         >= @Passengers
        AND f.[IsActive]               = 1
        AND f.[DeletedAt]              IS NULL
        AND (
            @Class <> 'Business'
            OR f.[BusinessPrice] IS NOT NULL
        )
    ORDER BY
        CASE WHEN @SortBy = 'Price'     THEN
            CASE @Class WHEN 'Business' THEN f.[BusinessPrice] ELSE f.[EconomyPrice] END
        END ASC,
        CASE WHEN @SortBy = 'Duration'  THEN f.[Duration]      END ASC,
        CASE WHEN @SortBy = 'Departure' THEN f.[DepartureTime] END ASC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO
