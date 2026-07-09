package com.fptu.fcms.event;

/**
 * Event phát ra khi KnowledgeArchive được tạo/cập nhật/xoá.
 * DEV3 (Batch 4) sẽ lắng nghe event này để thực hiện ingestion/reindex.
 *
 * @param archiveID ID của KnowledgeArchive
 * @param operation "CREATE" | "UPDATE" | "DELETE"
 */
public record KnowledgeArchiveIndexedEvent(Integer archiveID, String operation) {}
