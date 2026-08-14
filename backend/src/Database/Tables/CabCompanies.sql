CREATE TABLE [dbo].[CabCompanies] (
    [Id]                  UNIQUEIDENTIFIER NOT NULL,
    [Name]                NVARCHAR (MAX)   NOT NULL,
    [ContactEmail]        NVARCHAR (MAX)   NULL,
    [ContactPhone]        NVARCHAR (MAX)   NULL,
    [City]                NVARCHAR (MAX)   NULL,
    [CabTypes]            NVARCHAR (MAX)   NULL,
    [IsIndividualDriver]  BIT              NOT NULL,
    [DriverLicenseNumber] NVARCHAR (MAX)   NULL,
    [IsActive]            BIT              NOT NULL,
    [CreatedAt]           DATETIME2 (7)    NOT NULL,
    [UpdatedAt]           DATETIME2 (7)    NULL,
    [DeletedAt]           DATETIME2 (7)    NULL,
    CONSTRAINT [PK_CabCompanies] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
