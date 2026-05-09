CREATE TABLE [dbo].[Flights]
(
    [FlightId]       UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    [Airline]        NVARCHAR(100)     NOT NULL,
    [FlightNumber]   NVARCHAR(20)      NOT NULL,
    [Source]         NVARCHAR(10)      NOT NULL,   -- IATA code e.g. BOM, DEL
    [Destination]    NVARCHAR(10)      NOT NULL,
    [DepartureTime]  DATETIME2         NOT NULL,
    [ArrivalTime]    DATETIME2         NOT NULL,
    [Duration]       INT               NOT NULL,   -- minutes
    [TotalSeats]     INT               NOT NULL,
    [AvailableSeats] INT               NOT NULL,
    [EconomyPrice]   DECIMAL(10, 2)    NOT NULL,
    [BusinessPrice]  DECIMAL(10, 2)    NULL,
    [Stops]          INT               NOT NULL DEFAULT 0,
    [IsActive]       BIT               NOT NULL DEFAULT 1,
    [CreatedAt]      DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]      DATETIME2         NULL,
    [DeletedAt]      DATETIME2         NULL,

    CONSTRAINT [PK_Flights]               PRIMARY KEY ([FlightId]),
    CONSTRAINT [CK_Flights_Seats]         CHECK ([AvailableSeats] >= 0 AND [AvailableSeats] <= [TotalSeats]),
    CONSTRAINT [CK_Flights_Duration]      CHECK ([Duration] > 0),
    CONSTRAINT [CK_Flights_ArrivalAfter]  CHECK ([ArrivalTime] > [DepartureTime]),
    CONSTRAINT [CK_Flights_Price]         CHECK ([EconomyPrice] > 0)
);
GO

CREATE INDEX [IX_Flights_Route]     ON [dbo].[Flights] ([Source], [Destination]) WHERE [DeletedAt] IS NULL;
GO
CREATE INDEX [IX_Flights_Departure] ON [dbo].[Flights] ([DepartureTime])         WHERE [DeletedAt] IS NULL;
GO
