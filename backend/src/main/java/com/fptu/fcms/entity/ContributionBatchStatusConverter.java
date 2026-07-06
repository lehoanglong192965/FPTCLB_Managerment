package com.fptu.fcms.entity;

import com.fptu.fcms.enums.ContributionBatchStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class ContributionBatchStatusConverter implements AttributeConverter<ContributionBatchStatus, String> {

    @Override
    public String convertToDatabaseColumn(ContributionBatchStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public ContributionBatchStatus convertToEntityAttribute(String dbData) {
        return ContributionBatchStatus.fromValue(dbData);
    }
}
