CREATE TABLE [dbo].[Users] (
    [Id]                UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [Name]              NVARCHAR (100)   NOT NULL,
    [Email]             NVARCHAR (255)   NOT NULL,
    [Phone]             NVARCHAR (15)    NULL,
    [PasswordHash]      NVARCHAR (500)   NOT NULL,
    [Role]              NVARCHAR (MAX)   DEFAULT (N'User') NOT NULL,
    [IsVerified]        BIT              DEFAULT (CONVERT([bit],(0))) NOT NULL,
    [IsActive]          BIT              DEFAULT (CONVERT([bit],(1))) NOT NULL,
    [CreatedAt]         DATETIME2 (7)    DEFAULT (getutcdate()) NOT NULL,
    [UpdatedAt]         DATETIME2 (7)    NULL,
    [DeletedAt]         DATETIME2 (7)    NULL,
    [HotelId]           UNIQUEIDENTIFIER NULL,
    [OperatorCompanyId] UNIQUEIDENTIFIER NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_Email]
    ON [dbo].[Users]([Email] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Users_Phone]
    ON [dbo].[Users]([Phone] ASC);


GO
