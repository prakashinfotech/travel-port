CREATE TABLE [dbo].[AuditLogs]
(
    [LogId]     UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
    [UserId]    UNIQUEIDENTIFIER  NULL,
    [Action]    NVARCHAR(100)     NOT NULL,   -- e.g. BookFlight, CancelBooking, Login
    [Entity]    NVARCHAR(100)     NOT NULL,   -- e.g. Booking, User
    [EntityId]  NVARCHAR(100)     NULL,
    [OldValues] NVARCHAR(MAX)     NULL,       -- JSON snapshot before change
    [NewValues] NVARCHAR(MAX)     NULL,       -- JSON snapshot after change
    [IpAddress] NVARCHAR(50)      NULL,
    [CreatedAt] DATETIME2         NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([LogId])
    -- No FK on UserId intentionally: audit log must survive user deletion
);
GO

CREATE INDEX [IX_AuditLogs_UserId]    ON [dbo].[AuditLogs] ([UserId])    WHERE [UserId] IS NOT NULL;
GO
CREATE INDEX [IX_AuditLogs_Entity]    ON [dbo].[AuditLogs] ([Entity], [EntityId]);
GO
CREATE INDEX [IX_AuditLogs_CreatedAt] ON [dbo].[AuditLogs] ([CreatedAt] DESC);
GO
