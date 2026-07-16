package com.fptu.fcms.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
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

    @NotBlank(message = "Ảnh đại diện câu lạc bộ không được để trống")
    private String clubImage;

    private String clubImagePublicId;

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



    @NotEmpty(message = "Danh sách thành viên sáng lập không được để trống")
    @Valid
    private List<FoundingMemberDTO> foundingMembers;
}
