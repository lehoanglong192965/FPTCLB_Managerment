package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClubResponseDTO {
    private Integer clubID;
    private String abbr;       // Mã viết tắt (clubCode)
    private String name;       // Tên câu lạc bộ (clubName)
    private String desc;       // Mô tả (description)
    private String tag;        // Lĩnh vực (category)
    private String emoji;      // Tự động map theo category
    private String color;      // Tự động map theo category
    private Integer members;   // Số lượng thành viên thực trong DB
    private Boolean recruiting;// Mặc định true
    private String clubImage;
    private String clubImagePublicId;
    private String clubStatus;
    private String contactEmail;
    private String contactPhone;
    private String facebookUrl;
}
