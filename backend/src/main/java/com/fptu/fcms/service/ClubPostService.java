package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.CreateClubPostRequest;
import com.fptu.fcms.dto.response.ClubPostPageResponse;
import com.fptu.fcms.dto.response.ClubPostResponse;
import com.fptu.fcms.security.UserPrincipal;

public interface ClubPostService {

    ClubPostResponse createPost(Integer clubId, CreateClubPostRequest request, UserPrincipal currentUser);

    ClubPostPageResponse getPosts(Integer clubId, UserPrincipal currentUser, int page, int size);
}
