package com.fptu.fcms.repository;

import com.fptu.fcms.entity.ClubPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClubPostRepository extends JpaRepository<ClubPost, Integer> {

    Page<ClubPost> findByClubIDAndIsDeletedFalseOrderByCreatedAtDesc(Integer clubId, Pageable pageable);
}
