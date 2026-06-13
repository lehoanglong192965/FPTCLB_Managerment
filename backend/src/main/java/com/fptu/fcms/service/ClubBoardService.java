package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ClubBoardChangeRequest;
import com.fptu.fcms.dto.response.ClubBoardMemberResponse;

import java.util.List;

public interface ClubBoardService {
    ClubBoardMemberResponse changeBoardMember(Integer clubID, ClubBoardChangeRequest request, Integer actorID);
    List<ClubBoardMemberResponse> getBoardMembers(Integer clubID);
}