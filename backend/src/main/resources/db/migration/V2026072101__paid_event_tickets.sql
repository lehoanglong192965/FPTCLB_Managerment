IF COL_LENGTH('dbo.Event', 'isPaidEvent') IS NULL
    ALTER TABLE dbo.Event ADD isPaidEvent BIT NOT NULL CONSTRAINT DF_Event_IsPaidEvent DEFAULT 0;
IF COL_LENGTH('dbo.Event', 'ticketPrice') IS NULL
    ALTER TABLE dbo.Event ADD ticketPrice DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Event', 'ticketCurrency') IS NULL
    ALTER TABLE dbo.Event ADD ticketCurrency VARCHAR(3) NOT NULL CONSTRAINT DF_Event_TicketCurrency DEFAULT 'VND';

IF COL_LENGTH('dbo.EventRegistration', 'paymentStatus') IS NULL
    ALTER TABLE dbo.EventRegistration ADD paymentStatus VARCHAR(20) NOT NULL CONSTRAINT DF_EventRegistration_PaymentStatus DEFAULT 'NOT_REQUIRED';
IF COL_LENGTH('dbo.EventRegistration', 'amountDue') IS NULL
    ALTER TABLE dbo.EventRegistration ADD amountDue DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.EventRegistration', 'amountPaid') IS NULL
    ALTER TABLE dbo.EventRegistration ADD amountPaid DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.EventRegistration', 'paymentCurrency') IS NULL
    ALTER TABLE dbo.EventRegistration ADD paymentCurrency VARCHAR(3) NULL;
IF COL_LENGTH('dbo.EventRegistration', 'paymentReference') IS NULL
    ALTER TABLE dbo.EventRegistration ADD paymentReference VARCHAR(64) NULL;
IF COL_LENGTH('dbo.EventRegistration', 'paymentMethod') IS NULL
    ALTER TABLE dbo.EventRegistration ADD paymentMethod VARCHAR(30) NULL;
IF COL_LENGTH('dbo.EventRegistration', 'paidAt') IS NULL
    ALTER TABLE dbo.EventRegistration ADD paidAt DATETIME2 NULL;
IF COL_LENGTH('dbo.EventRegistration', 'paymentExpiresAt') IS NULL
    ALTER TABLE dbo.EventRegistration ADD paymentExpiresAt DATETIME2 NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.EventRegistration') AND name = N'UX_EventRegistration_PaymentReference')
    EXEC(N'CREATE UNIQUE NONCLUSTERED INDEX UX_EventRegistration_PaymentReference
        ON dbo.EventRegistration(paymentReference)
        WHERE paymentReference IS NOT NULL;');
