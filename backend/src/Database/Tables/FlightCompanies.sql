CREATE TABLE [dbo].[FlightCompanies] (
    [Id]               UNIQUEIDENTIFIER NOT NULL,
    [Name]             NVARCHAR (MAX)   NOT NULL,
    [IataCode]         NVARCHAR (MAX)   NOT NULL,
    [LogoUrl]          NVARCHAR (MAX)   NULL,
    [ContactEmail]     NVARCHAR (MAX)   NULL,
    [ContactPhone]     NVARCHAR (MAX)   NULL,
    [HeadquartersCity] NVARCHAR (MAX)   NULL,
    [IsActive]         BIT              NOT NULL,
    [CreatedAt]        DATETIME2 (7)    NOT NULL,
    [UpdatedAt]        DATETIME2 (7)    NULL,
    [DeletedAt]        DATETIME2 (7)    NULL,
    CONSTRAINT [PK_FlightCompanies] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
