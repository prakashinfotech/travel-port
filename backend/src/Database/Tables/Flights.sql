CREATE TABLE [dbo].[Flights] (
    [Id]                     UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [Airline]                NVARCHAR (100)   NOT NULL,
    [FlightNumber]           NVARCHAR (20)    NOT NULL,
    [Source]                 NVARCHAR (10)    NOT NULL,
    [Destination]            NVARCHAR (10)    NOT NULL,
    [DepartureTime]          DATETIME2 (7)    NOT NULL,
    [ArrivalTime]            DATETIME2 (7)    NOT NULL,
    [Duration]               INT              NOT NULL,
    [TotalSeats]             INT              NOT NULL,
    [AvailableSeats]         INT              NOT NULL,
    [EconomyPrice]           DECIMAL (10, 2)  NOT NULL,
    [BusinessPrice]          DECIMAL (10, 2)  NULL,
    [Stops]                  INT              DEFAULT ((0)) NOT NULL,
    [IsActive]               BIT              DEFAULT (CONVERT([bit],(1))) NOT NULL,
    [CreatedAt]              DATETIME2 (7)    DEFAULT (getutcdate()) NOT NULL,
    [UpdatedAt]              DATETIME2 (7)    NULL,
    [DeletedAt]              DATETIME2 (7)    NULL,
    [FlightCompanyId]        UNIQUEIDENTIFIER NULL,
    [LayoverAirport]         NVARCHAR (10)    NULL,
    [LayoverDurationMinutes] INT              NULL,
    [LadiesSeats]            NVARCHAR (MAX)   NULL,
    [SeatLayoutConfig]       NVARCHAR (MAX)   NULL,
    [SeatRows]               INT              DEFAULT ((0)) NOT NULL,
    CONSTRAINT [PK_Flights] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Flights_FlightCompanies_FlightCompanyId] FOREIGN KEY ([FlightCompanyId]) REFERENCES [dbo].[FlightCompanies] ([Id])
);


GO

CREATE NONCLUSTERED INDEX [IX_Flights_Departure]
    ON [dbo].[Flights]([DepartureTime] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Flights_Route]
    ON [dbo].[Flights]([Source] ASC, [Destination] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Flights_FlightCompanyId]
    ON [dbo].[Flights]([FlightCompanyId] ASC);


GO
