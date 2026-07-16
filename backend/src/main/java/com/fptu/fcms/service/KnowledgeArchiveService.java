package com.fptu.fcms.service;

import com.fptu.fcms.entity.KnowledgeArchive;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service cho quản lý Kho tri thức (Knowledge Archive).
 */
public interface KnowledgeArchiveService {

    /**
     * Tạo mới tài liệu tri thức (upload file + lưu DB + bắn event).
     */
    KnowledgeArchive create(String title, MultipartFile file, Integer clubID,
                            String visibilityScope, Integer uploadedByUserId,
                            String roleName, String userClubRole, Integer userClubId);

    /**
     * Lấy danh sách tài liệu theo clubID.
     */
    List<KnowledgeArchive> getByClub(Integer clubID);

    /**
     * Lấy danh sách tài liệu Public.
     */
    List<KnowledgeArchive> getPublic();

    /**
     * Lấy chi tiết 1 tài liệu.
     */
    KnowledgeArchive getById(Integer archiveID);

    /**
     * Soft delete tài liệu.
     */
    void delete(Integer archiveID);

    /**
     * Reindex tài liệu có indexingStatus = 'Failed'.
     */
    void reindex(Integer archiveID);
}
