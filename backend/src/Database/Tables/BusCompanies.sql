CREATE TABLE [dbo].[BusCompanies] (
    [Id]               UNIQUEIDENTIFIER NOT NULL,
    [Name]             NVARCHAR (MAX)   NOT NULL,
    [ContactEmail]     NVARCHAR (MAX)   NULL,
    [ContactPhone]     NVARCHAR (MAX)   NULL,
    [HeadquartersCity] NVARCHAR (MAX)   NULL,
    [BusTypes]         NVARCHAR (MAX)   NULL,
    [IsActive]         BIT              NOT NULL,
    [CreatedAt]        DATETIME2 (7)    NOT NULL,
    [UpdatedAt]        DATETIME2 (7)    NULL,
    [DeletedAt]        DATETIME2 (7)    NULL,
    CONSTRAINT [PK_BusCompanies] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
