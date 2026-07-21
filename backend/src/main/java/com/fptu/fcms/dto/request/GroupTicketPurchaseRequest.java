package com.fptu.fcms.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class GroupTicketPurchaseRequest {

    @Valid
    @NotNull
    @Size(min = 1, max = 4)
    private List<Participant> participants;

    @Getter
    @Setter
    public static class Participant {
        @NotBlank
        @Size(max = 150)
        private String fullName;

        @NotBlank
        @Email
        @Size(max = 255)
        private String email;

        @NotBlank
        @Size(max = 30)
        private String phone;

        @Size(max = 20)
        private String studentId;
    }
}
