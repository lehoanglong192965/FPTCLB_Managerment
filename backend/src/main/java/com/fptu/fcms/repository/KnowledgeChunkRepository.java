package com.fptu.fcms.repository;

import com.fptu.fcms.entity.KnowledgeChunk;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// Lớp giao tiếp Database lưu trữ các phần văn bản con (chunk) và vector nhúng.
// Đầu vào: Nhận đối tượng KnowledgeChunk từ service.
// Đầu ra: Thực hiện lưu song song chunk text và vector vào SQL Server. Cung cấp cơ chế Rehydration (qua @PostConstruct bên Service) sử dụng lệnh SELECT có điều kiện isDeleted = false để tải toàn bộ vector hợp lệ từ DB lên RAM khi ứng dụng khởi động.
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
