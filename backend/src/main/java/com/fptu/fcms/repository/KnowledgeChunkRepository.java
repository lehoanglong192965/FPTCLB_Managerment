package com.fptu.fcms.repository;

import com.fptu.fcms.entity.KnowledgeChunk;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunk, Integer> {
    List<KnowledgeChunk> findByArchiveIDAndIsDeletedFalse(Integer archiveID);

    List<KnowledgeChunk> findByIsDeletedFalse();

    @Query("""
            select chunk
            from KnowledgeChunk chunk
            join KnowledgeArchive archive on archive.archiveID = chunk.archiveID
            where chunk.isDeleted = false
              and archive.isDeleted = false
              and (archive.visibilityScope = 'Public' or archive.clubID = :clubID)
            """)
    List<KnowledgeChunk> findVisibleChunksForClub(@Param("clubID") Integer clubID);
}
