IF OBJECT_ID('dbo.PaymentWebhookTransaction', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PaymentWebhookTransaction;
END;
