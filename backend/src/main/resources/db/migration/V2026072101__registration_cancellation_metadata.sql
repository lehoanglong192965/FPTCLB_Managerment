IF COL_LENGTH('EventRegistration', 'cancelledAt') IS NULL
    ALTER TABLE EventRegistration ADD cancelledAt DATETIME2 NULL;
IF COL_LENGTH('EventRegistration', 'cancellationReason') IS NULL
    ALTER TABLE EventRegistration ADD cancellationReason NVARCHAR(500) NULL;
IF COL_LENGTH('EventRegistration', 'cancellationSource') IS NULL
    ALTER TABLE EventRegistration ADD cancellationSource VARCHAR(30) NULL;

IF COL_LENGTH('GuestEventRegistration', 'cancellationReason') IS NULL
    ALTER TABLE GuestEventRegistration ADD cancellationReason NVARCHAR(500) NULL;
IF COL_LENGTH('GuestEventRegistration', 'cancellationSource') IS NULL
    ALTER TABLE GuestEventRegistration ADD cancellationSource VARCHAR(30) NULL;

IF OBJECT_ID('EventNotificationDispatch', 'U') IS NULL
BEGIN
    CREATE TABLE EventNotificationDispatch (
        dispatchID BIGINT IDENTITY(1,1) PRIMARY KEY,
        eventID INT NOT NULL,
        recipientKey VARCHAR(255) NOT NULL,
        notificationType VARCHAR(50) NOT NULL,
        sentAt DATETIME2 NOT NULL,
        CONSTRAINT UQ_EventNotificationDispatch UNIQUE (eventID, recipientKey, notificationType)
    );
END;
