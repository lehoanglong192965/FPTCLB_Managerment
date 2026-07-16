package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.PersonnelReassignRequest;
import com.fptu.fcms.entity.PersonnelReassignLog;

import java.util.List;

public interface PersonnelReassignService {
    PersonnelReassignLog reassign(PersonnelReassignRequest request, Integer actorID);
    List<PersonnelReassignLog> getHistory();
}