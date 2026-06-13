package com.fptu.fcms.repository;

import com.fptu.fcms.entity.RecruitmentReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecruitmentReminderRepository extends JpaRepository<RecruitmentReminder, Integer> {
}
