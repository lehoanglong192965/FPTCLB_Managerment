package com.fptu.fcms.repository;

import com.fptu.fcms.entity.RecruitmentApplication;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecruitmentApplicationRepository
        extends JpaRepository<RecruitmentApplication, Integer> {

    /*
     * Lock record khi withdraw
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
            "SELECT r " +
                    "FROM RecruitmentApplication r " +
                    "WHERE r.applicationID = :applicationID " +
                    "AND r.isDeleted = false"
    )
    Optional<RecruitmentApplication> findByIdForUpdate(
            @Param("applicationID") Integer applicationID
    );

    /*
     * Đếm đơn blocking cùng CLB + học kỳ
     */
    @Query(
            "SELECT COUNT(r) " +
                    "FROM RecruitmentApplication r " +
                    "WHERE r.userID = :userID " +
                    "AND r.clubID = :clubID " +
                    "AND r.semesterID = :semesterID " +
                    "AND r.isDeleted = false " +
                    "AND r.status IN " +
                    "('Submitted','Reviewing','Interviewing','Approved','Rejected')"
    )
    long countBlockingApplications(
            @Param("userID") Integer userID,
            @Param("clubID") Integer clubID,
            @Param("semesterID") Integer semesterID
    );

    /*
     * Đếm số đơn pending trong học kỳ
     */
    @Query(
            "SELECT COUNT(r) " +
                    "FROM RecruitmentApplication r " +
                    "WHERE r.userID = :userID " +
                    "AND r.semesterID = :semesterID " +
                    "AND r.isDeleted = false " +
                    "AND r.status IN " +
                    "('Submitted','Reviewing','Interviewing')"
    )
    int countPendingApplications(
            @Param("userID") Integer userID,
            @Param("semesterID") Integer semesterID
    );

    /*
     * Scheduler quét draft quá hạn
     */
    List<RecruitmentApplication>
    findByStatusAndIsDeletedFalseAndCreatedAtBefore(
            String status,
            LocalDateTime date
    );
}