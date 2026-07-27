package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CompleteRefundRequest {
    @Size(max = 20, message = "Mã ngân hàng không được vượt quá 20 ký tự.")
    private String refundBankCode;

    @Size(max = 100, message = "Tên ngân hàng không được vượt quá 100 ký tự.")
    private String refundBankName;

    @Size(max = 50, message = "Số tài khoản không được vượt quá 50 ký tự.")
    private String refundAccountNumber;

    @Size(max = 150, message = "Tên chủ tài khoản không được vượt quá 150 ký tự.")
    private String refundAccountHolder;

    @NotBlank(message = "Mã giao dịch hoàn tiền không được để trống.")
    @Size(max = 100, message = "Mã giao dịch hoàn tiền không được vượt quá 100 ký tự.")
    private String transactionReference;

    @Size(max = 500, message = "Ghi chú hoàn tiền không được vượt quá 500 ký tự.")
    private String note;
}
