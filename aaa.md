# Implementation Plan - Fix Backend Compile and Database Schema Discrepancies

Fix Java compilation issue in `CompetitionServiceImpl.java` and synchronize schema discrepancies in `SQLQuery.sql` (AuditLog, MemberPerformance, and ContributionBatch).

## Comprehensive Project Scan Results

We executed a full cross-check of all 55 JPA entities in the backend codebase (`com.fptu.fcms.entity`) against `SQLQuery.sql` using custom schema comparison scripts (presence check + type check). 

Here are the verification findings:
1. **No Missing Tables**: All Java entities have their corresponding SQL tables defined in `SQLQuery.sql`.
2. **False Positive Solved**: The column `uniqueness` in table `ClubRegistration` was reported missing by the initial script. Upon inspection, this was a parser bug (the script incorrectly skipped it thinking it was a SQL `UNIQUE` constraint keyword because it starts with `UNIQUE`). The column is correctly defined as `uniqueness NVARCHAR(MAX) NOT NULL` in `SQLQuery.sql` and `String uniqueness` in `ClubRegistration.java`.
3. **Confirmed Column Type Discrepancies**:
   - `ContributionBatch.finalizedBy` is mapped as `Integer` in Java, but `DATETIME` in `SQLQuery.sql`. This must be updated to `INT`.
4. **Confirmed Missing Columns**:
   - `AuditLog` table lacks `eventID`, `registrationID`, `attendanceRecordID`, and `requestId`.
   - `MemberPerformance` table lacks `sourceContributionID` and `individualRankingEligible`.
5. **No Other Mismatches**: All other columns in the 55 entities match in name, type compatibility, and constraints.

---

## Proposed Changes

### Backend Compile Fix

#### [MODIFY] [CompetitionServiceImpl.java](file:///d:/5/swp391/fcms_project/backend/src/main/java/com/fptu/fcms/service/impl/CompetitionServiceImpl.java)
Modify lines 106-108 to use Java method references (`CompetitionScore::getTotalScore`, `CompetitionScore::getActivityScore`, `CompetitionScore::getParticipationScore`) instead of lambda expressions, which fail to compile due to type inference failure when combined with `.reversed()`.

```diff
-        scores.sort(Comparator.comparing(x -> x.getTotalScore()).reversed()
-                .thenComparing(Comparator.comparing(x -> x.getActivityScore()).reversed())
-                .thenComparing(Comparator.comparing(x -> x.getParticipationScore()).reversed()));
+        scores.sort(Comparator.comparing(CompetitionScore::getTotalScore).reversed()
+                .thenComparing(Comparator.comparing(CompetitionScore::getActivityScore).reversed())
+                .thenComparing(Comparator.comparing(CompetitionScore::getParticipationScore).reversed()));
```

---

### Database Schema Synchronization (`SQLQuery.sql`)

#### [MODIFY] [SQLQuery.sql](file:///d:/5/swp391/fcms_project/SQLQuery.sql)

##### 1. Table `ContributionBatch`
Change the data type of the `finalizedBy` column from `DATETIME` to `INT` to match the entity definition (`Integer finalizedBy` in `ContributionBatch.java` line 76) and how it is assigned in the service implementation (`batch.setFinalizedBy(actorId)` in `ContributionBatchServiceImpl.java` line 414).

```diff
     appealClosesAt     DATETIME      NULL,
     finalizedAt        DATETIME      NULL,
-    finalizedBy        DATETIME      NULL,
+    finalizedBy        INT           NULL,
     createdAt          DATETIME      NOT NULL DEFAULT GETDATE(),
```

##### 2. Table `AuditLog`
Add the following missing columns to the `AuditLog` table definition in `SQLQuery.sql` (Part 10, line 805) to match the entity properties in `AuditLog.java`:
- `eventID INT NULL`
- `registrationID INT NULL`
- `attendanceRecordID INT NULL`
- `requestId VARCHAR(80) NULL`

```diff
     beforeJson    NVARCHAR(MAX) NULL,              
     afterJson     NVARCHAR(MAX) NULL,              
     reason        NVARCHAR(MAX) NULL,         
+    eventID       INT           NULL,
+    registrationID INT          NULL,
+    attendanceRecordID INT      NULL,
+    requestId     VARCHAR(80)   NULL,
     executedAt    DATETIME      NOT NULL DEFAULT GETDATE(),
```

##### 3. Table `MemberPerformance`
Add the following missing columns to the `MemberPerformance` table definition in `SQLQuery.sql` (Part 7, line 660) to match the entity properties in `MemberPerformance.java`:
- `sourceContributionID INT NULL`
- `individualRankingEligible BIT NOT NULL DEFAULT 1`

```diff
     finalPoints   AS (basePoints + bonusPoints - penaltyPoints) PERSISTED, 
     leaderEvaluation NVARCHAR(MAX) NULL,           
+    sourceContributionID INT   NULL,
+    individualRankingEligible BIT NOT NULL DEFAULT 1,
     updatedAt     DATETIME     NOT NULL DEFAULT GETDATE(),
```

---

## Verification Plan

### Automated Tests
- Run `mvn clean compile` in the backend directory. Note: If the JDK 26 Lombok compatibility environment crash persists, we will perform meticulous manual validation on syntax, types, and cross-references.

### Manual Verification
- Execute the updated DDL from `SQLQuery.sql` on local SQL Server to ensure syntax correctness of the modified table definitions.
- Inspect the entity mappings to guarantee the fields and database columns match exactly in spelling, nullable configuration, and types.


rà soát lại 1 lần nữa , tìm kiếm các lỗi còn sót, rà soát chéo với code toàn bộ project . phát sinh gì thì lên plan lại và tự fix 