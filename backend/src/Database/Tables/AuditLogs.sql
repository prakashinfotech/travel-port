CREATE TABLE [dbo].[AuditLogs] (
    [Id]        UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    [UserId]    UNIQUEIDENTIFIER NULL,
    [Action]    NVARCHAR (100)   NOT NULL,
    [Entity]    NVARCHAR (100)   NOT NULL,
    [EntityId]  NVARCHAR (100)   NULL,
    [OldValues] NVARCHAR (MAX)   NULL,
    [NewValues] NVARCHAR (MAX)   NULL,
    [IpAddress] NVARCHAR (50)    NULL,
    [CreatedAt] DATETIME2 (7)    DEFAULT (getutcdate()) NOT NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
