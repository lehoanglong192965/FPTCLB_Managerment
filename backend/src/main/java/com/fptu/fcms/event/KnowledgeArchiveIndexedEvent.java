package com.fptu.fcms.event;

/**
 * Event phát ra khi KnowledgeArchive được tạo/cập nhật/xoá.
 * DEV3 (Batch 4) sẽ lắng nghe event này để thực hiện ingestion/reindex.
 * Đầu vào: ID của tài liệu và loại hành động (CREATE/UPDATE/DELETE).
 * Đầu ra: Event này thông báo cho hệ thống hoàn tất giao dịch đồng bộ, giúp client nhận phản hồi nhanh chóng mà không bị block bởi tiến trình vector hóa nặng nề phía sau.
 *
 * @param archiveID ID của KnowledgeArchive
 * @param operation "CREATE" | "UPDATE" | "DELETE"
 */
public record KnowledgeArchiveIndexedEvent(Integer archiveID, String operation) {}
