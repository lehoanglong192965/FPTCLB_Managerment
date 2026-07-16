IF COL_LENGTH('dbo.Club', 'clubImagePublicId') IS NULL
BEGIN
    ALTER TABLE dbo.Club ADD clubImagePublicId NVARCHAR(500) NULL;
END;

IF COL_LENGTH('dbo.ClubRegistration', 'clubImagePublicId') IS NULL
BEGIN
    ALTER TABLE dbo.ClubRegistration ADD clubImagePublicId NVARCHAR(500) NULL;
END;

IF COL_LENGTH('dbo.ClubRegistrationMember', 'cardImagePublicId') IS NULL
BEGIN
    ALTER TABLE dbo.ClubRegistrationMember ADD cardImagePublicId NVARCHAR(500) NULL;
END;

IF COL_LENGTH('dbo.Event', 'bannerPublicId') IS NULL
BEGIN
    ALTER TABLE dbo.Event ADD bannerPublicId NVARCHAR(500) NULL;
END;
