package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ClubKPI;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubKPIRepository extends JpaRepository<ClubKPI, Integer> {
    @Override
    @CacheEvict(value = "memberRanking", allEntries = true)
    <S extends ClubKPI> S save(S entity);

    @Override
    @CacheEvict(value = "memberRanking", allEntries = true)
    <S extends ClubKPI> List<S> saveAll(Iterable<S> entities);
}