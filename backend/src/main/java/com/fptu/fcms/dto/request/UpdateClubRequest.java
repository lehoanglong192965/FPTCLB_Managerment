package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateClubRequest {

    @Size(max = 100, message = "Tên CLB không được vượt quá 100 ký tự")
    private String clubName;

    @Size(max = 1000, message = "Mô tả không được vượt quá 1000 ký tự")
    private String description;

    @Size(max = 100, message = "Thể loại không được vượt quá 100 ký tự")
    private String category;

    @Size(max = 500, message = "URL ảnh không được vượt quá 500 ký tự")
    private String clubImage;

    @Size(max = 500, message = "Cloudinary publicId khong duoc vuot qua 500 ky tu")
    private String clubImagePublicId;

    @Size(max = 100, message = "Email liên hệ không được vượt quá 100 ký tự")
    private String contactEmail;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String contactPhone;

    @Size(max = 300, message = "Facebook URL không được vượt quá 300 ký tự")
    private String facebookUrl;
}
