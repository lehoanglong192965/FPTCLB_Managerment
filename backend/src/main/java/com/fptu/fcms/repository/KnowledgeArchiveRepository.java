package com.fptu.fcms.repository;

import com.fptu.fcms.entity.KnowledgeArchive;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

// Lớp giao tiếp với Database cho phần Metadata tài liệu.
// Đầu vào: Nhận đối tượng KnowledgeArchive từ tầng Service.
// Đầu ra: Lưu trữ và cung cấp các truy vấn lấy thông tin tài liệu. Trạng thái mặc định khi tạo mới thường là 'Pending' (đang chờ vector hóa).
public interface KnowledgeArchiveRepository extends JpaRepository<KnowledgeArchive, Integer> {
    Optional<KnowledgeArchive> findByArchiveIDAndIsDeletedFalse(Integer archiveID);

    List<KnowledgeArchive> findByClubIDAndIsDeletedFalse(Integer clubID);

    List<KnowledgeArchive> findByVisibilityScopeAndIsDeletedFalse(String visibilityScope);
}
