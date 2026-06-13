package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class ClubRegistrationRequestDTO {
    @NotBlank(message = "Mã câu lạc bộ không được để trống")
    private String clubCode;

    @NotBlank(message = "Tên câu lạc bộ không được để trống")
    private String clubName;

    private String clubNameEn;

    @NotBlank(message = "Lĩnh vực hoạt động không được để trống")
    private String category;

    private String description;

    @NotBlank(message = "Sứ mệnh không được để trống")
    private String mission;

    @NotBlank(message = "Lý do thành lập/Tính độc nhất không được để trống")
    private String uniqueness;

    @NotBlank(message = "Sơ đồ tổ chức/Ban chuyên môn không được để trống")
    private String orgStructure;

    @NotBlank(message = "Tần suất sinh hoạt định kỳ không được để trống")
    private String meetingFrequency;

    @NotBlank(message = "Địa điểm sinh hoạt dự kiến không được để trống")
    private String meetingLocation;

    @NotBlank(message = "Phương án tài chính không được để trống")
    private String financialPlan;

    // Leader details
    @NotBlank(message = "MSSV Chủ nhiệm không được để trống")
    private String leaderStudentId;

    @NotBlank(message = "Họ tên Chủ nhiệm không được để trống")
    private String leaderName;

    @NotBlank(message = "Email Chủ nhiệm không được để trống")
    private String leaderEmail;

    @NotBlank(message = "Số điện thoại Chủ nhiệm không được để trống")
    private String leaderPhone;

    private String leaderCohort;
    private String leaderClass;
    private String leaderFb;
    private String leaderExperience;

    @NotBlank(message = "Ảnh minh chứng thẻ sinh viên của Chủ nhiệm không được để trống")
    private String leaderCardImage;

    // Vice Leader details
    @NotBlank(message = "MSSV Phó chủ nhiệm không được để trống")
    private String viceLeaderStudentId;

    @NotBlank(message = "Họ tên Phó chủ nhiệm không được để trống")
    private String viceLeaderName;

    @NotBlank(message = "Email Phó chủ nhiệm không được để trống")
    private String viceLeaderEmail;

    @NotBlank(message = "Số điện thoại Phó chủ nhiệm không được để trống")
    private String viceLeaderPhone;

    private String viceLeaderCohort;
    private String viceLeaderClass;
    private String viceLeaderFb;
    private String viceLeaderExperience;

    @NotBlank(message = "Ảnh minh chứng thẻ sinh viên của Phó chủ nhiệm không được để trống")
    private String viceLeaderCardImage;

    @NotEmpty(message = "Danh sách thành viên sáng lập không được để trống")
    private List<FoundingMemberDTO> foundingMembers;
}
