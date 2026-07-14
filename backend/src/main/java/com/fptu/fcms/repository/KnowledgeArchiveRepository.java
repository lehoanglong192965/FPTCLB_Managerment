package com.fptu.fcms.repository;

import com.fptu.fcms.entity.KnowledgeArchive;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeArchiveRepository extends JpaRepository<KnowledgeArchive, Integer> {
    Optional<KnowledgeArchive> findByArchiveIDAndIsDeletedFalse(Integer archiveID);

    List<KnowledgeArchive> findByClubIDAndIsDeletedFalse(Integer clubID);

    List<KnowledgeArchive> findByVisibilityScopeAndIsDeletedFalse(String visibilityScope);
}
