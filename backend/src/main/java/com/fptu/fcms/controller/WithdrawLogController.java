package com.fptu.fcms.controller;

import com.fptu.fcms.entity.WithdrawLog;
import com.fptu.fcms.repository.WithdrawLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/withdraw-logs")
@Tag(name = "Withdraw Logs", description = "API quản lý lịch sử rút đơn")
@RequiredArgsConstructor
public class WithdrawLogController {

    private final WithdrawLogRepository repository;

    @GetMapping("/count")
    @Operation(summary = "Đếm số lần rút đơn của sinh viên trong học kỳ")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Số lần rút đơn trả về")
    })
    public ResponseEntity<Long> countByStudentAndSemester(
            @RequestParam("studentId") Integer studentId,
            @RequestParam("semesterId") Integer semesterId
    ) {
        long count = repository.countByStudentIDAndSemesterID(studentId, semesterId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/latest")
    @Operation(summary = "Lấy lần rút đơn gần nhất của sinh viên tại một CLB")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trả về WithdrawLog"),
            @ApiResponse(responseCode = "204", description = "Không tìm thấy")
    })
    public ResponseEntity<WithdrawLog> getLatestWithdrawLog(
            @RequestParam("studentId") Integer studentId,
            @RequestParam("clubId") Integer clubId
    ) {
        Optional<WithdrawLog> opt = repository.findTopByStudentIDAndClubIDOrderByWithdrawnAtDesc(studentId, clubId);
        return opt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/exists")
    @Operation(summary = "Kiểm tra application đã có log rút chưa")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trả về true nếu đã rút, false nếu chưa")
    })
    public ResponseEntity<Boolean> existsByApplication(
            @RequestParam("applicationId") Integer applicationId
    ) {
        boolean exists = repository.existsByApplicationID(applicationId);
        return ResponseEntity.ok(exists);
    }
}

