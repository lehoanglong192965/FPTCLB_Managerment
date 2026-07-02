# BE-2 Feedback Competition Contract

## Internal Service

BE-3 should use the modular-monolith internal service:

```java
FeedbackCompetitionInput getCompetitionInput(Integer eventId);
```

BE-2 owns eligibility, feedback storage, external feedback filtering, aggregate metrics, and assessment status. BE-3 owns competition scoring and how `INSUFFICIENT_SAMPLE` affects final club competition policy.

## Assessment Enum

```text
GOOD
NOT_GOOD
INSUFFICIENT_SAMPLE
```

`INSUFFICIENT_SAMPLE` must not be mapped to `NOT_GOOD` or zero points by BE-2.

## FeedbackCompetitionInput

Allowed fields:

- `eventId`
- `clubId`
- `eligibleExternalPresentCount`
- `externalFeedbackResponseCount`
- `externalFeedbackResponseRate`
- `averageOverallRating`
- `positiveFeedbackCount`
- `positiveFeedbackRate`
- `feedbackAssessmentStatus`
- `minimumEligiblePresentCountUsed`
- `minimumResponseCountUsed`
- `goodAverageRatingThresholdUsed`
- `goodPositiveFeedbackRateThresholdUsed`
- `calculatedAt`

Forbidden fields:

- full name
- email
- phone
- student ID
- guest reference
- feedback token
- OTP
- raw identified comments

## External Feedback Inclusion

Included in competition input:

- `GUEST` with attendance `PRESENT`
- `FPT_STUDENT_NON_HOST_CLUB_MEMBER` with attendance `PRESENT`

Excluded from competition input:

- Host Club Member feedback, though it remains stored for internal summary.
- `ABSENT` registrations.

## Default Thresholds

Config keys:

- `FEEDBACK_MIN_ELIGIBLE_EXTERNAL_PRESENT = 10`
- `FEEDBACK_MIN_RESPONSE_COUNT = 5`
- `FEEDBACK_MIN_RESPONSE_RATE = 0.20`
- `FEEDBACK_GOOD_AVERAGE_RATING = 4.00`
- `FEEDBACK_GOOD_POSITIVE_RATE = 0.70`

## Formula

```text
minimumResponseCountRequired
= max(FEEDBACK_MIN_RESPONSE_COUNT,
      ceil(eligibleExternalPresentCount * FEEDBACK_MIN_RESPONSE_RATE))
```

```text
positiveFeedbackCount = count(external feedback where overallRating >= 4)
positiveFeedbackRate = positiveFeedbackCount / externalFeedbackResponseCount
```

Assessment:

```text
eligibleExternalPresentCount < FEEDBACK_MIN_ELIGIBLE_EXTERNAL_PRESENT
  => INSUFFICIENT_SAMPLE

externalFeedbackResponseCount < minimumResponseCountRequired
  => INSUFFICIENT_SAMPLE

averageOverallRating >= FEEDBACK_GOOD_AVERAGE_RATING
AND positiveFeedbackRate >= FEEDBACK_GOOD_POSITIVE_RATE
  => GOOD

otherwise
  => NOT_GOOD
```
