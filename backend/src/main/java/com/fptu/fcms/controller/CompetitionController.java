package com.fptu.fcms.controller;

import com.fptu.fcms.entity.Competition;
import com.fptu.fcms.service.CompetitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/competitions")
@RequiredArgsConstructor
public class CompetitionController {

    private final CompetitionService competitionService;

    // --- BE-COMP-01: CRUD ---

    @GetMapping
    public ResponseEntity<List<Competition>> getAllCompetitions() {
        return ResponseEntity.ok(competitionService.getAllCompetitions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Competition> getCompetition(@PathVariable Integer id) {
        return ResponseEntity.ok(competitionService.getCompetitionById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<Competition> createCompetition(@RequestBody Competition competition) {
        return ResponseEntity.ok(competitionService.createCompetition(competition));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<Competition> updateCompetition(@PathVariable Integer id, @RequestBody Competition competition) {
        return ResponseEntity.ok(competitionService.updateCompetition(id, competition));
    }

    // --- BE-COMP-09: Ranking ---

    @GetMapping("/{id}/ranking")
    public ResponseEntity<Map<String, Object>> getCompetitionRanking(@PathVariable Integer id) {
        return ResponseEntity.ok(competitionService.getCompetitionRanking(id));
    }

    // --- BE-COMP-08: Calculate ---

    @PostMapping("/{id}/calculate")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<String> calculateScores(@PathVariable Integer id) {
        competitionService.calculateScores(id);
        return ResponseEntity.ok("Score calculation completed");
    }

    // --- BE-COMP-10: Approve / Publish ---

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<String> approveCompetition(@PathVariable Integer id) {
        competitionService.approveCompetition(id);
        return ResponseEntity.ok("Competition approved");
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<String> publishCompetition(@PathVariable Integer id) {
        competitionService.publishCompetition(id);
        return ResponseEntity.ok("Competition published");
    }

    // --- BE-COMP-11: Award ---

    @PostMapping("/{id}/awards")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<String> assignAwards(@PathVariable Integer id) {
        competitionService.assignAwards(id);
        return ResponseEntity.ok("Awards assigned");
    }
}
