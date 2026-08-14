CREATE TABLE [dbo].[Buses] (
    [Id]               UNIQUEIDENTIFIER NOT NULL,
    [BusNumber]        NVARCHAR (MAX)   NOT NULL,
    [BusCompanyId]     UNIQUEIDENTIFIER NOT NULL,
    [Origin]           NVARCHAR (MAX)   NOT NULL,
    [Destination]      NVARCHAR (MAX)   NOT NULL,
    [DepartureTime]    DATETIME2 (7)    NOT NULL,
    [ArrivalTime]      DATETIME2 (7)    NOT NULL,
    [DurationMinutes]  INT              NOT NULL,
    [TotalSeats]       INT              NOT NULL,
    [AvailableSeats]   INT              NOT NULL,
    [Price]            DECIMAL (18, 2)  NOT NULL,
    [BusType]          NVARCHAR (MAX)   NOT NULL,
    [SeatLayoutConfig] NVARCHAR (MAX)   NOT NULL,
    [SeatRows]         INT              NOT NULL,
    [LadiesSeats]      NVARCHAR (MAX)   NULL,
    [Amenities]        NVARCHAR (MAX)   NULL,
    [DriverName]       NVARCHAR (MAX)   NULL,
    [DriverPhone]      NVARCHAR (MAX)   NULL,
    [DriverLicense]    NVARCHAR (MAX)   NULL,
    [StaffDetails]     NVARCHAR (MAX)   NULL,
    [PhotoUrl]         NVARCHAR (MAX)   NULL,
    [ScheduleType]     NVARCHAR (MAX)   NOT NULL,
    [DaysOfWeek]       NVARCHAR (MAX)   NULL,
    [BoardingPoints]   NVARCHAR (MAX)   NULL,
    [DroppingPoints]   NVARCHAR (MAX)   NULL,
    [IsActive]         BIT              NOT NULL,
    [CreatedAt]        DATETIME2 (7)    NOT NULL,
    [UpdatedAt]        DATETIME2 (7)    NULL,
    [DeletedAt]        DATETIME2 (7)    NULL,
    CONSTRAINT [PK_Buses] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Buses_BusCompanies_BusCompanyId] FOREIGN KEY ([BusCompanyId]) REFERENCES [dbo].[BusCompanies] ([Id])
);


GO

CREATE NONCLUSTERED INDEX [IX_Buses_BusCompanyId]
    ON [dbo].[Buses]([BusCompanyId] ASC);


GO
