-- Flattened, ready-to-query view for flight search API responses
CREATE VIEW [dbo].[vw_FlightSearchResults]
AS
SELECT
    f.[FlightId],
    f.[Airline],
    f.[FlightNumber],
    f.[Source],
    f.[Destination],
    f.[DepartureTime],
    f.[ArrivalTime],
    f.[Duration],
    f.[AvailableSeats],
    f.[TotalSeats],
    f.[EconomyPrice],
    f.[BusinessPrice],
    f.[Stops],
    DATEDIFF(HOUR, f.[DepartureTime], f.[ArrivalTime])   AS [DurationHours],
    DATEDIFF(MINUTE, f.[DepartureTime], f.[ArrivalTime]) % 60 AS [DurationMinutes],
    CAST(f.[DepartureTime] AS DATE)                      AS [DepartureDate],
    FORMAT(f.[DepartureTime], 'HH:mm')                   AS [DepartureTimeStr],
    FORMAT(f.[ArrivalTime],   'HH:mm')                   AS [ArrivalTimeStr]
FROM [dbo].[Flights] f
WHERE f.[IsActive] = 1 AND f.[DeletedAt] IS NULL;
GO
