package com.fptu.fcms.dto.response;

/**
 * Response DTO cho thông tin một thành viên trong Ban điều hành CLB.
 *
 * Trả về sau khi bổ nhiệm/bãi nhiệm thành công, hoặc trong GET danh sách ban điều hành.
 */
public class ClubBoardMemberResponse {

    /** ID bản ghi membership */
    private Integer membershipID;

    /** ID của user */
    private Integer userID;

    /** Họ tên đầy đủ của user */
    private String fullName;

    /** Email FPT của user */
    private String email;

    /** Tên vai trò CLB hiện tại: Leader / ViceLeader / Member */
    private String clubRoleName;

    /** ID học kỳ đang active */
    private Integer semesterID;

    /** Mã học kỳ (ví dụ: SU26) */
    private String semesterCode;

    /** ID CLB */
    private Integer clubID;

    // =====================================================================
    // Constructors
    // =====================================================================

    public ClubBoardMemberResponse() {}

    public ClubBoardMemberResponse(Integer membershipID, Integer userID, String fullName,
                                   String email, String clubRoleName,
                                   Integer semesterID, String semesterCode, Integer clubID) {
        this.membershipID = membershipID;
        this.userID = userID;
        this.fullName = fullName;
        this.email = email;
        this.clubRoleName = clubRoleName;
        this.semesterID = semesterID;
        this.semesterCode = semesterCode;
        this.clubID = clubID;
    }

    // =====================================================================
    // Getters & Setters
    // =====================================================================

    public Integer getMembershipID() { return membershipID; }
    public void setMembershipID(Integer membershipID) { this.membershipID = membershipID; }

    public Integer getUserID() { return userID; }
    public void setUserID(Integer userID) { this.userID = userID; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getClubRoleName() { return clubRoleName; }
    public void setClubRoleName(String clubRoleName) { this.clubRoleName = clubRoleName; }

    public Integer getSemesterID() { return semesterID; }
    public void setSemesterID(Integer semesterID) { this.semesterID = semesterID; }

    public String getSemesterCode() { return semesterCode; }
    public void setSemesterCode(String semesterCode) { this.semesterCode = semesterCode; }

    public Integer getClubID() { return clubID; }
    public void setClubID(Integer clubID) { this.clubID = clubID; }
}