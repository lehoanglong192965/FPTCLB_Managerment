package com.fptu.fcms.repository;

import com.fptu.fcms.entity.MemberPerformance;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface MemberPerformanceRepository extends JpaRepository<MemberPerformance, Integer> {
    List<MemberPerformance> findByClubIDAndUserIDInAndIsDeletedFalse(Integer clubID, Collection<Integer> userIDs);

    List<MemberPerformance> findByClubIDAndEventIDInAndUserIDInAndIsDeletedFalse(
            Integer clubID,
            Collection<Integer> eventIDs,
            Collection<Integer> userIDs
    );

    @Override
    @CacheEvict(value = "memberRanking", allEntries = true)
    <S extends MemberPerformance> S save(S entity);

    @Override
    @CacheEvict(value = "memberRanking", allEntries = true)
    <S extends MemberPerformance> List<S> saveAll(Iterable<S> entities);
}
