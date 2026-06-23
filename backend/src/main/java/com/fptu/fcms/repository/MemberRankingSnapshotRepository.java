package com.fptu.fcms.repository;

import com.fptu.fcms.entity.MemberRankingSnapshot;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MemberRankingSnapshotRepository extends JpaRepository<MemberRankingSnapshot, Integer> {
    @Override
    @CacheEvict(value = "memberRanking", allEntries = true)
    <S extends MemberRankingSnapshot> S save(S entity);

    @Override
    @CacheEvict(value = "memberRanking", allEntries = true)
    <S extends MemberRankingSnapshot> List<S> saveAll(Iterable<S> entities);
    List<MemberRankingSnapshot> findBySemesterIDAndClubIDAndIsDeletedFalseOrderByRankAscUserIDAsc(
            Integer semesterID,
            Integer clubID
    );

    @CacheEvict(value = "memberRanking", allEntries = true)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE MemberRankingSnapshot s
            SET s.isDeleted = true
            WHERE s.semesterID = :semesterId
              AND s.clubID = :clubId
              AND s.isDeleted = false
            """)
    void softDeleteActiveSnapshots(
            @Param("semesterId") Integer semesterId,
            @Param("clubId") Integer clubId
    );
}
