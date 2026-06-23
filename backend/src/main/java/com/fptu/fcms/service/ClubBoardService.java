package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ClubBoardChangeRequest;
import com.fptu.fcms.dto.response.ClubBoardMemberResponse;
import com.fptu.fcms.dto.response.ClubMemberResponse;

import java.util.List;

public interface ClubBoardService {
    ClubBoardMemberResponse changeBoardMember(Integer clubID, ClubBoardChangeRequest request, Integer actorID);
    List<ClubBoardMemberResponse> getBoardMembers(Integer clubID);
    List<ClubMemberResponse> getAllMembers(Integer clubID);
}