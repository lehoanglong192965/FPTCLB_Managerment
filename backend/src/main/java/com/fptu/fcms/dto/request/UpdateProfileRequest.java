package com.fptu.fcms.dto.request;

public class UpdateProfileRequest {

    private String fullName;

    private String major;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName)
    {
        this.fullName = fullName;
    }

    public String getMajor()
    {
        return major;
    }
    public void setMajor(String major)
    {
        this.major = major;
    }
}