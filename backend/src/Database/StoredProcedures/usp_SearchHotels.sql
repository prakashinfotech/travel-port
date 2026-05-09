CREATE PROCEDURE [dbo].[usp_SearchHotels]
    @City       NVARCHAR(100),
    @CheckIn    DATE,
    @CheckOut   DATE,
    @Guests     INT          = 1,
    @Rooms      INT          = 1,
    @MinPrice   DECIMAL(10,2) = NULL,
    @MaxPrice   DECIMAL(10,2) = NULL,
    @MinRating  DECIMAL(2,1)  = NULL,
    @SortBy     NVARCHAR(20)  = 'Price',  -- Price | Rating
    @PageNumber INT           = 1,
    @PageSize   INT           = 10
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    DECLARE @Nights INT = DATEDIFF(DAY, @CheckIn, @CheckOut);

    IF @Nights <= 0
    BEGIN
        RAISERROR('CheckOut must be after CheckIn.', 16, 1);
        RETURN;
    END;

    SELECT
        h.[HotelId],
        h.[Name],
        h.[City],
        h.[Address],
        h.[StarRating],
        h.[Amenities],
        h.[Latitude],
        h.[Longitude],
        MIN(r.[PricePerNight])           AS [MinPricePerNight],
        MIN(r.[PricePerNight]) * @Nights AS [TotalMinPrice],
        COUNT(1) OVER ()                 AS [TotalCount]
    FROM [dbo].[Hotels] h
    INNER JOIN [dbo].[HotelRooms] r
        ON r.[HotelId] = h.[HotelId]
        AND r.[IsActive] = 1
        AND r.[MaxGuests] >= @Guests
        AND r.[TotalRooms] >= @Rooms
        AND r.[DeletedAt] IS NULL
    WHERE
        h.[City]      = @City
        AND h.[IsActive]  = 1
        AND h.[DeletedAt] IS NULL
        AND (@MinRating IS NULL OR h.[StarRating] >= @MinRating)
        AND (@MinPrice  IS NULL OR r.[PricePerNight] >= @MinPrice)
        AND (@MaxPrice  IS NULL OR r.[PricePerNight] <= @MaxPrice)
    GROUP BY
        h.[HotelId], h.[Name], h.[City], h.[Address],
        h.[StarRating], h.[Amenities], h.[Latitude], h.[Longitude]
    ORDER BY
        CASE WHEN @SortBy = 'Price'  THEN MIN(r.[PricePerNight]) END ASC,
        CASE WHEN @SortBy = 'Rating' THEN h.[StarRating]         END DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO
