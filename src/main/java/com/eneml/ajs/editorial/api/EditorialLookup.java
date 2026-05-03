package com.eneml.ajs.editorial.api;

import java.util.List;

public interface EditorialLookup {

    List<EditorialDecisionSummary> historyOf(Long submissionId);
}
