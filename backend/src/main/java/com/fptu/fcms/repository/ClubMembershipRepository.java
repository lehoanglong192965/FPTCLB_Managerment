package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ClubMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubMembershipRepository extends JpaRepository<ClubMembership, Integer> {

    /** Tìm membership active của 1 user trong 1 CLB ở 1 kỳ */
    Optional<ClubMembership> findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(
            Integer clubID, Integer userID, Integer semesterID);

    /** Tìm Leader (hoặc bất kỳ role) hiện tại của CLB trong kỳ */
    Optional<ClubMembership> findByClubIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
            Integer clubID, Integer semesterID, Integer clubRoleID);

    /** Lấy danh sách ban điều hành (nhiều role) trong kỳ */
    List<ClubMembership> findByClubIDAndSemesterIDAndClubRoleIDInAndIsDeletedFalse(
            Integer clubID, Integer semesterID, List<Integer> roleIDs);

    /** Kiểm tra user đang là Leader ở bất kỳ CLB nào trong kỳ */
    boolean existsByUserIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
            Integer userID, Integer semesterID, Integer clubRoleID);

    /** Soft-delete membership cụ thể */
    @Modifying
    @Query("UPDATE ClubMembership m SET m.isDeleted = true " +
           "WHERE m.clubID = :clubID AND m.userID = :userID " +
           "AND m.semesterID = :semesterID AND m.isDeleted = false")
    int softDeleteMembership(
            @Param("clubID") Integer clubID,
            @Param("userID") Integer userID,
            @Param("semesterID") Integer semesterID);
}
